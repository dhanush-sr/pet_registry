import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// Custom Vite plugin to handle photo uploads during development
function photoUploadPlugin() {
  return {
    name: "photo-upload",
    configureServer(server: any) {
      server.middlewares.use("/api/upload", (req: any, res: any, next: any) => {
        if (req.method !== "POST") return next();

        let body = "";
        req.on("data", (chunk: string) => { body += chunk; });
        req.on("end", () => {
          try {
            const { dataUrl, filename } = JSON.parse(body);

            // Extract base64 data
            const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid data URL" }));
              return;
            }

            const buffer = Buffer.from(matches[2], "base64");
            const ext = path.extname(filename) || ".png";
            const nameOnly = path.basename(filename, ext);
            const safeFilename = `${nameOnly}_${Date.now()}${ext}`;

            const targetDir = path.resolve(import.meta.dirname, "public", "images", "dogs");
            fs.mkdirSync(targetDir, { recursive: true });

            const filePath = path.join(targetDir, safeFilename);
            fs.writeFileSync(filePath, buffer);

            const url = `/images/dogs/${safeFilename}`;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ url }));
          } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to upload photo" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), photoUploadPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: true,
  },
});

