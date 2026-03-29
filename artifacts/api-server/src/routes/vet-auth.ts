import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { VetLoginBody } from "@workspace/api-zod";
import { requireVet } from "../middlewares/requireVet";

const router: IRouter = Router();

router.post("/vet/login", async (req, res) => {
  try {
    const parsed = VetLoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const { username, password } = parsed.data;
    const vet = await db
      .select()
      .from(vetsTable)
      .where(eq(vetsTable.username, username))
      .then((r) => r[0] || null);

    if (!vet) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, vet.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }

    const payload = { id: vet.id, username: vet.username, name: vet.name, clinic: vet.clinic };
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    res.json({ token, vet: payload });
  } catch (err) {
    req.log.error({ err }, "Vet login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/vet/me", requireVet, (req, res) => {
  res.json(req.vet);
});

export default router;
