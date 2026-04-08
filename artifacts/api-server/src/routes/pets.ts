import { Router, type IRouter } from "express";
import fs from "fs/promises";
import path from "path";
import { db } from "@workspace/db";
import { petsTable, ownersTable, vaccinationRecordsTable, medicalRecordsTable } from "@workspace/db";
import { eq, ilike, or, and, sql } from "drizzle-orm";

import {
  CreatePetBody,
  UpdatePetBody,
  VerifyPetQueryParams,
  ListPetsQueryParams,
  AddVaccinationBody,
  AddMedicalRecordBody,
  UploadPhotoBody,
} from "@workspace/api-zod";
import { requireVet } from "../middlewares/requireVet";

const router: IRouter = Router();

async function generatePetId(): Promise<string> {
  const MIN_START = 11; // Start from DOG011 since DOG001-DOG010 exist
  const rows = await db
    .select({ petId: petsTable.petId })
    .from(petsTable)
    .where(sql`${petsTable.petId} LIKE 'DOG%'`);

  let maxNum = MIN_START - 1;
  for (const row of rows) {
    const match = row.petId.match(/^DOG(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `DOG${String(nextNum).padStart(3, "0")}`;
}

async function buildPetWithOwner(petId: string) {
  const rows = await db
    .select()
    .from(petsTable)
    .leftJoin(ownersTable, eq(petsTable.ownerId, ownersTable.id))
    .where(eq(petsTable.id, petId));
  if (!rows.length) return null;
  const { pets, owners } = rows[0];
  return { ...pets, owner: owners };
}

async function buildPetProfile(petId: string) {
  const pet = await buildPetWithOwner(petId);
  if (!pet) return null;
  const vaccinations = await db
    .select()
    .from(vaccinationRecordsTable)
    .where(eq(vaccinationRecordsTable.petId, petId));
  const medicalRecords = await db
    .select()
    .from(medicalRecordsTable)
    .where(eq(medicalRecordsTable.petId, petId));
  return { ...pet, vaccinations, medicalRecords };
}

router.get("/pets", async (req, res) => {
  try {
    const parsed = ListPetsQueryParams.safeParse(req.query);
    const { status, search } = parsed.success ? parsed.data : { status: undefined, search: undefined };

    let query = db
      .select()
      .from(petsTable)
      .leftJoin(ownersTable, eq(petsTable.ownerId, ownersTable.id))
      .$dynamic();

    const conditions = [];
    if (status) conditions.push(eq(petsTable.status, status as any));
    if (search) {
      conditions.push(
        or(
          ilike(petsTable.name, `%${search}%`),
          ilike(petsTable.petId, `%${search}%`),
          ilike(petsTable.species, `%${search}%`),
          ilike(petsTable.breed, `%${search}%`),
          ilike(ownersTable.name, `%${search}%`),
          ilike(ownersTable.phone, `%${search}%`)
        )
      );
    }
    if (conditions.length) query = query.where(and(...conditions)) as any;

    const rows = await query;
    const result = rows.map(({ pets, owners }) => ({ ...pets, owner: owners }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list pets");
    res.status(500).json({ error: "Failed to list pets" });
  }
});

router.get("/pets/verify", async (req, res) => {
  try {
    const parsed = VerifyPetQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }
    const { petId, phone, rhinariumId } = parsed.data;
    if (!petId && !phone && !rhinariumId) {
      res.status(400).json({ error: "Provide petId, phone, or rhinariumId" });
      return;
    }

    const conditions = [];
    if (petId) conditions.push(eq(petsTable.petId, petId));
    if (rhinariumId) conditions.push(eq(petsTable.rhinariumId, rhinariumId));

    let petIds: string[] = [];
    if (conditions.length) {
      const rows = await db.select({ id: petsTable.id }).from(petsTable).where(or(...conditions));
      petIds = rows.map((r) => r.id);
    }
    if (phone) {
      const ownerRows = await db.select({ id: ownersTable.id }).from(ownersTable).where(eq(ownersTable.phone, phone));
      if (ownerRows.length) {
        const petRows = await db
          .select({ id: petsTable.id })
          .from(petsTable)
          .where(eq(petsTable.ownerId, ownerRows[0].id));
        petIds = [...new Set([...petIds, ...petRows.map((r) => r.id)])];
      }
    }

    if (!petIds.length) {
      res.status(404).json({ error: "No pets found" });
      return;
    }

    const profiles = await Promise.all(petIds.map((id) => buildPetProfile(id)));
    res.json(profiles.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Failed to verify pet");
    res.status(500).json({ error: "Failed to verify pet" });
  }
});

router.get("/pets/:id", async (req, res) => {
  try {
    const profile = await buildPetProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: "Pet not found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to get pet");
    res.status(500).json({ error: "Failed to get pet" });
  }
});

router.post("/pets", async (req, res) => {
  try {
    const parsed = CreatePetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { ownerName, ownerPhone, ownerEmail, ...petData } = parsed.data;

    let owner = await db
      .select()
      .from(ownersTable)
      .where(eq(ownersTable.phone, ownerPhone))
      .then((r) => r[0] || null);

    if (!owner) {
      const inserted = await db
        .insert(ownersTable)
        .values({ name: ownerName, phone: ownerPhone, email: ownerEmail ?? null })
        .returning();
      owner = inserted[0];
    }

    const petId = await generatePetId();
    const inserted = await db
      .insert(petsTable)
      .values({
        petId,
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        age: petData.age,
        gender: (petData.gender as any) ?? "Unknown",
        rhinariumId: petData.rhinariumId ?? null,
        photoUrl: petData.photoUrl ?? null,
        status: "Pending",
        ownerId: owner.id,
      })
      .returning();

    const pet = inserted[0];
    const result = await buildPetWithOwner(pet.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to create pet");
    res.status(500).json({ error: "Failed to create pet" });
  }
});

router.patch("/pets/:id", requireVet, async (req, res) => {
  try {
    const parsed = UpdatePetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const updateData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(parsed.data)) {
      if (val !== undefined) updateData[key] = val;
    }
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    await db.update(petsTable).set(updateData as any).where(eq(petsTable.id, req.params.id));
    const result = await buildPetWithOwner(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Pet not found" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to update pet");
    res.status(500).json({ error: "Failed to update pet" });
  }
});

router.patch("/pets/:id/verify", requireVet, async (req, res) => {
  try {
    await db.update(petsTable).set({ status: "Verified" }).where(eq(petsTable.id, req.params.id));
    const result = await buildPetWithOwner(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Pet not found" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to verify pet");
    res.status(500).json({ error: "Failed to verify pet" });
  }
});

router.get("/pets/:id/vaccinations", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(vaccinationRecordsTable)
      .where(eq(vaccinationRecordsTable.petId, req.params.id));
    res.json(records);
  } catch (err) {
    req.log.error({ err }, "Failed to get vaccinations");
    res.status(500).json({ error: "Failed to get vaccinations" });
  }
});

router.post("/pets/:id/vaccinations", requireVet, async (req, res) => {
  try {
    const parsed = AddVaccinationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const inserted = await db
      .insert(vaccinationRecordsTable)
      .values({
        petId: req.params.id,
        type: parsed.data.type,
        date: new Date(parsed.data.date),
        verified: parsed.data.verified,
        notes: parsed.data.notes ?? null,
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to add vaccination");
    res.status(500).json({ error: "Failed to add vaccination" });
  }
});

router.get("/pets/:id/medical", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(medicalRecordsTable)
      .where(eq(medicalRecordsTable.petId, req.params.id));
    res.json(records);
  } catch (err) {
    req.log.error({ err }, "Failed to get medical records");
    res.status(500).json({ error: "Failed to get medical records" });
  }
});

router.post("/pets/:id/medical", requireVet, async (req, res) => {
  try {
    const parsed = AddMedicalRecordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const inserted = await db
      .insert(medicalRecordsTable)
      .values({ petId: req.params.id, notes: parsed.data.notes })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to add medical record");
    res.status(500).json({ error: "Failed to add medical record" });
  }
});

router.get("/admin/stats", async (req, res) => {
  try {
    const total = await db.select({ count: sql<number>`count(*)` }).from(petsTable);
    const verified = await db
      .select({ count: sql<number>`count(*)` })
      .from(petsTable)
      .where(eq(petsTable.status, "Verified"));
    const pending = await db
      .select({ count: sql<number>`count(*)` })
      .from(petsTable)
      .where(eq(petsTable.status, "Pending"));
    const incomplete = await db
      .select({ count: sql<number>`count(*)` })
      .from(petsTable)
      .where(eq(petsTable.status, "Incomplete"));
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recent = await db
      .select({ count: sql<number>`count(*)` })
      .from(petsTable)
      .where(sql`${petsTable.createdAt} >= ${recentDate}`);

    res.json({
      total: Number(total[0].count),
      verified: Number(verified[0].count),
      pending: Number(pending[0].count),
      incomplete: Number(incomplete[0].count),
      recentRegistrations: Number(recent[0].count),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Failed to get admin stats" });
  }
});

router.post("/upload", async (req, res) => {
  try {
    const parsed = UploadPhotoBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { dataUrl, filename } = parsed.data;
    
    // Extract base64 data
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: "Invalid data URL" });
      return;
    }

    const type = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    
    // Determine extension or use original filename
    const ext = path.extname(filename) || ".png";
    const nameOnly = path.basename(filename, ext);
    const safeFilename = `${nameOnly}_${Date.now()}${ext}`;
    
    // Resolve absolute path to artifacts/petretriever/public/images/dogs
    // Assumes server is running in artifacts/api-server
    const targetDir = path.resolve(process.cwd(), "..", "petretriever", "public", "images", "dogs");
    
    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });
    
    const filePath = path.join(targetDir, safeFilename);
    await fs.writeFile(filePath, buffer);

    // Return the URL relative to the frontend's public folder
    const url = `/images/dogs/${safeFilename}`;
    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "Failed to upload photo");
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

export default router;
