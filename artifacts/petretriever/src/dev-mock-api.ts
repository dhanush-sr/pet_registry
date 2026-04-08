import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'mock-db.json');

// Initial demo pets from src/data/pets.ts (converted to the API schema format)
const initDemoPets = () => {
  return [
    { id: "demo-001", petId: "DOG001", name: "Buddy", species: "Dog", breed: "Golden Retriever", age: 3, gender: "Male", photoUrl: "/images/dogs/dogo1.jpeg", status: "Pending", createdAt: "2025-11-15T00:00:00.000Z", rhinariumId: "RH-2025-BDY1", owner: { id: "owner-1", name: "John Smith", phone: "5551234567", email: "john@example.com" }, vaccinations: [{ id: "v1", petId: "demo-001", type: "Rabies", date: "2025-06-01T00:00:00.000Z", verified: true, notes: null }, { id: "v2", petId: "demo-001", type: "Parvo", date: "2025-06-15T00:00:00.000Z", verified: true, notes: null }, { id: "v3", petId: "demo-001", type: "Distemper", date: "2025-07-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
    { id: "demo-002", petId: "DOG002", name: "Max", species: "Dog", breed: "German Shepherd", age: 5, gender: "Male", photoUrl: "/images/dogs/dogo2.jpeg", status: "Pending", createdAt: "2025-09-22T00:00:00.000Z", rhinariumId: "RH-2025-MAX2", owner: { id: "owner-2", name: "Sarah Johnson", phone: "5559876543", email: "sarah@example.com" }, vaccinations: [{ id: "v4", petId: "demo-002", type: "Rabies", date: "2025-05-01T00:00:00.000Z", verified: true, notes: null }, { id: "v5", petId: "demo-002", type: "Parvo", date: "2025-05-15T00:00:00.000Z", verified: true, notes: null }, { id: "v6", petId: "demo-002", type: "Bordetella", date: "2025-06-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
    { id: "demo-003", petId: "DOG003", name: "Bella", species: "Dog", breed: "Labrador Retriever", age: 2, gender: "Female", photoUrl: "/images/dogs/dogo3.jpeg", status: "Pending", createdAt: "2026-01-08T00:00:00.000Z", rhinariumId: "RH-2026-BLA3", owner: { id: "owner-3", name: "Emily Davis", phone: "5555551234", email: "emily@example.com" }, vaccinations: [{ id: "v7", petId: "demo-003", type: "Rabies", date: "2025-12-01T00:00:00.000Z", verified: true, notes: null }, { id: "v8", petId: "demo-003", type: "Distemper", date: "2025-12-15T00:00:00.000Z", verified: true, notes: null }, { id: "v9", petId: "demo-003", type: "Leptospirosis", date: "2026-01-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
    { id: "demo-004", petId: "DOG004", name: "Charlie", species: "Dog", breed: "Beagle", age: 4, gender: "Male", photoUrl: "/images/dogs/dogo4.jpeg", status: "Pending", createdAt: "2025-12-03T00:00:00.000Z", rhinariumId: "RH-2025-CHL4", owner: { id: "owner-4", name: "Michael Brown", phone: "5551112222", email: "michael@example.com" }, vaccinations: [{ id: "v10", petId: "demo-004", type: "Rabies", date: "2025-10-01T00:00:00.000Z", verified: true, notes: null }, { id: "v11", petId: "demo-004", type: "Parvo", date: "2025-10-15T00:00:00.000Z", verified: true, notes: null }, { id: "v12", petId: "demo-004", type: "Distemper", date: "2025-11-01T00:00:00.000Z", verified: true, notes: null }, { id: "v13", petId: "demo-004", type: "Hepatitis", date: "2025-11-15T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
    { id: "demo-005", petId: "DOG005", name: "Luna", species: "Dog", breed: "Siberian Husky", age: 1, gender: "Female", photoUrl: "/images/dogs/dogo5.jpeg", status: "Pending", createdAt: "2026-02-14T00:00:00.000Z", rhinariumId: "RH-2026-LNA5", owner: { id: "owner-5", name: "Jessica Wilson", phone: "5553334444", email: "jessica@example.com" }, vaccinations: [{ id: "v14", petId: "demo-005", type: "Rabies", date: "2026-01-15T00:00:00.000Z", verified: true, notes: null }, { id: "v15", petId: "demo-005", type: "Parvo", date: "2026-02-01T00:00:00.000Z", verified: false, notes: null }], medicalRecords: [] },
    { id: "demo-006", petId: "DOG006", name: "Rocky", species: "Dog", breed: "Rottweiler", age: 6, gender: "Male", photoUrl: "/images/dogs/dogo6.jpeg", status: "Verified", createdAt: "2025-10-30T00:00:00.000Z", rhinariumId: "RH-2025-RKY6", owner: { id: "owner-6", name: "David Martinez", phone: "5556667777", email: "david@example.com" }, vaccinations: [{ id: "v16", petId: "demo-006", type: "Rabies", date: "2025-08-01T00:00:00.000Z", verified: true, notes: null }, { id: "v17", petId: "demo-006", type: "Distemper", date: "2025-08-15T00:00:00.000Z", verified: true, notes: null }, { id: "v18", petId: "demo-006", type: "Parvo", date: "2025-09-01T00:00:00.000Z", verified: true, notes: null }, { id: "v19", petId: "demo-006", type: "Bordetella", date: "2025-09-15T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
    { id: "demo-007", petId: "DOG007", name: "Daisy", species: "Dog", breed: "Poodle", age: 3, gender: "Female", photoUrl: "/images/dogs/dogo7.jpeg", status: "Verified", createdAt: "2026-03-01T00:00:00.000Z", rhinariumId: "RH-2026-DSY7", owner: { id: "owner-7", name: "Amanda Taylor", phone: "5558889999", email: "amanda@example.com" }, vaccinations: [{ id: "v20", petId: "demo-007", type: "Rabies", date: "2026-01-01T00:00:00.000Z", verified: true, notes: null }, { id: "v21", petId: "demo-007", type: "Leptospirosis", date: "2026-01-15T00:00:00.000Z", verified: true, notes: null }, { id: "v22", petId: "demo-007", type: "Canine Influenza", date: "2026-02-01T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
    { id: "demo-008", petId: "DOG008", name: "Cooper", species: "Dog", breed: "Border Collie", age: 2, gender: "Male", photoUrl: "/images/dogs/dogo8.jpeg", status: "Verified", createdAt: "2025-08-19T00:00:00.000Z", rhinariumId: "RH-2025-CPR8", owner: { id: "owner-8", name: "Robert Anderson", phone: "5550001111", email: "robert@example.com" }, vaccinations: [{ id: "v23", petId: "demo-008", type: "Rabies", date: "2025-06-01T00:00:00.000Z", verified: true, notes: null }, { id: "v24", petId: "demo-008", type: "Parvo", date: "2025-06-15T00:00:00.000Z", verified: true, notes: null }, { id: "v25", petId: "demo-008", type: "Distemper", date: "2025-07-01T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
    { id: "demo-009", petId: "DOG009", name: "Datta", species: "Dog", breed: "Labrador", age: 4, gender: "Male", photoUrl: "/images/dogs/datta.jpeg", status: "Verified", createdAt: "2026-01-25T00:00:00.000Z", rhinariumId: "RH-2026-DTA9", owner: { id: "owner-9", name: "James Thomas", phone: "5552223333", email: "james@example.com" }, vaccinations: [{ id: "v26", petId: "demo-009", type: "Rabies", date: "2025-11-01T00:00:00.000Z", verified: true, notes: null }, { id: "v27", petId: "demo-009", type: "Parvo", date: "2025-11-15T00:00:00.000Z", verified: true, notes: null }, { id: "v28", petId: "demo-009", type: "Distemper", date: "2025-12-01T00:00:00.000Z", verified: true, notes: null }, { id: "v29", petId: "demo-009", type: "Leptospirosis", date: "2025-12-15T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
    { id: "demo-010", petId: "DOG010", name: "Skye", species: "Dog", breed: "Golden Retriever", age: 3, gender: "Female", photoUrl: "/images/dogs/skye.jpg", status: "Verified", createdAt: "2026-02-28T00:00:00.000Z", rhinariumId: "RH-2026-SKY0", owner: { id: "owner-10", name: "Patricia Garcia", phone: "5554445555", email: "patricia@example.com" }, vaccinations: [{ id: "v30", petId: "demo-010", type: "Rabies", date: "2026-01-01T00:00:00.000Z", verified: true, notes: null }, { id: "v31", petId: "demo-010", type: "Bordetella", date: "2026-01-15T00:00:00.000Z", verified: true, notes: null }, { id: "v32", petId: "demo-010", type: "Canine Influenza", date: "2026-02-01T00:00:00.000Z", verified: true, notes: null }], medicalRecords: [] },
  ];
};

function readDB() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch(e) {
      console.error("Failed to read mock DB", e);
    }
  }
  const db = initDemoPets().reduce((acc, p) => ({...acc, [p.id]: p}), {} as Record<string, any>);
  writeDB(db);
  return db;
}

function writeDB(db: Record<string, any>) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function devMockApiPlugin() {
  return {
    name: 'dev-mock-api',
    configureServer(server: any) {
      server.middlewares.use('/api', (req: any, res: any, next: any) => {
        // We only intercept if it's not handled by other middlewares
        const urlStr = req.url;
        const method = req.method;

        let body = "";
        req.on("data", (chunk: string) => { body += chunk; });
        req.on("end", () => {
          let bodyData: any = {};
          if (body) {
            try { bodyData = JSON.parse(body); } catch(e){}
          }

          res.setHeader('Content-Type', 'application/json');

          const sendJson = (status: number, data: any) => {
            res.statusCode = status;
            res.end(JSON.stringify(data));
          };

          try {
            // GET /api/healthz
            if (method === "GET" && urlStr.startsWith("/healthz")) {
              return sendJson(200, { status: "ok" });
            }

            // POST /api/vet/login
            if (method === "POST" && urlStr.startsWith("/vet/login")) {
              if (bodyData.username === "vetdemo" && bodyData.password === "vet1234") {
                return sendJson(200, {
                  token: "demo-token-12345",
                  vet: { id: "demo-id", username: "vetdemo", name: "Dr. Demo Vet", clinic: "Demo Veterinary Clinic" }
                });
              }
              return sendJson(401, { error: "Invalid credentials" });
            }

            // GET /api/admin/stats
            if (method === "GET" && urlStr.startsWith("/admin/stats")) {
              const allPets = Object.values(readDB()) as any[];
              const total = allPets.length;
              const verified = allPets.filter(p => p.status === "Verified").length;
              const pending = allPets.filter(p => p.status === "Pending").length;
              const incomplete = allPets.filter(p => p.status === "Incomplete").length;
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              const recentRegistrations = allPets.filter(p => new Date(p.createdAt) >= oneWeekAgo).length;
              return sendJson(200, { total, verified, pending, incomplete, recentRegistrations });
            }

            // GET /api/pets/verify
            if (method === "GET" && urlStr.startsWith("/pets/verify")) {
              const allPets = Object.values(readDB()) as any[];
              const urlObj = new URL(urlStr, "http://localhost");
              const petIdTerm = urlObj.searchParams.get("petId")?.toUpperCase();
              const phoneTerm = urlObj.searchParams.get("phone");
              const rhinariumTerm = urlObj.searchParams.get("rhinariumId");

              const results = allPets.filter((p: any) => {
                if (petIdTerm && p.petId?.toUpperCase() === petIdTerm) return true;
                if (phoneTerm && p.owner?.phone === phoneTerm) return true;
                if (rhinariumTerm && p.rhinariumId === rhinariumTerm) return true;
                return false;
              });

              return sendJson(200, results);
            }

            // GET /api/pets/:id
            if (method === "GET" && urlStr.match(/^\/pets\/(demo-|mock-)[^/?]+$/)) {
              const match = urlStr.match(/^\/pets\/([^/?]+)$/);
              if (match) {
                const db = readDB();
                if (db[match[1]]) {
                  return sendJson(200, db[match[1]]);
                }
                return sendJson(404, { error: "Not found" });
              }
            }

            // PATCH /api/pets/:id/verify
            if (method === "PATCH" && urlStr.match(/^\/pets\/[^/]+\/verify/)) {
              const id = urlStr.split("/")[2];
              const db = readDB();
              if (db[id]) {
                db[id].status = "Verified";
                writeDB(db);
                return sendJson(200, db[id]);
              }
              return sendJson(404, { error: "Not found" });
            }

            // POST /api/pets/:id/vaccinations
            if (method === "POST" && urlStr.match(/^\/pets\/[^/]+\/vaccinations/)) {
              const id = urlStr.split("/")[2];
              const db = readDB();
              if (db[id]) {
                const record = { id: "vax-" + Date.now(), petId: id, ...bodyData };
                if (!Array.isArray(db[id].vaccinations)) db[id].vaccinations = [];
                db[id].vaccinations.push(record);
                writeDB(db);
                return sendJson(200, record);
              }
              return sendJson(404, { error: "Not found" });
            }

            // POST /api/pets/:id/medical
            if (method === "POST" && urlStr.match(/^\/pets\/[^/]+\/medical/)) {
              const id = urlStr.split("/")[2];
              const db = readDB();
              if (db[id]) {
                const record = { id: "med-" + Date.now(), petId: id, createdAt: new Date().toISOString(), ...bodyData };
                if (!Array.isArray(db[id].medicalRecords)) db[id].medicalRecords = [];
                db[id].medicalRecords.push(record);
                writeDB(db);
                return sendJson(200, record);
              }
              return sendJson(404, { error: "Not found" });
            }

            // GET /api/pets
            if (method === "GET" && (urlStr === "/pets" || urlStr.startsWith("/pets?"))) {
              const db = readDB();
              let results = Object.values(db) as any[];
              
              const urlObj = new URL(urlStr, "http://localhost");
              const searchTerm = urlObj.searchParams.get("search");
              if (searchTerm) {
                const term = searchTerm.toLowerCase();
                results = results.filter((p: any) => 
                  p.name?.toLowerCase().includes(term) ||
                  p.petId?.toLowerCase().includes(term) ||
                  p.species?.toLowerCase().includes(term) ||
                  p.breed?.toLowerCase().includes(term) ||
                  p.owner?.name?.toLowerCase().includes(term)
                );
              }
              
              return sendJson(200, results);
            }

            // POST /api/pets
            if (method === "POST" && urlStr === "/pets") {
              const db = readDB();
              let maxNum = 10;
              for (const pet of Object.values(db) as any[]) {
                const match = pet.petId?.match(/^DOG(\d+)$/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (num > maxNum) maxNum = num;
                }
              }
              const petId = `DOG${String(maxNum + 1).padStart(3, "0")}`;
              const id = "mock-" + Date.now();
              const newPet = { 
                ...bodyData, 
                id, 
                petId, 
                status: "Pending", 
                createdAt: new Date().toISOString(),
                owner: { id: "owner-" + id, name: bodyData.ownerName, phone: bodyData.ownerPhone, email: bodyData.ownerEmail },
                vaccinations: [],
                medicalRecords: []
              };
              
              db[id] = newPet;
              writeDB(db);
              
              return sendJson(200, newPet);
            }

            // fallback to next
            next();
          } catch(err) {
            console.error("Mock API Error:", err);
            sendJson(500, { error: "Internal server error" });
          }
        });
      });
    }
  }
}
