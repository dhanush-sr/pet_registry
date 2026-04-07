import app from "./app";
import { logger } from "./lib/logger";

// Use PORT env var if provided (e.g. in deployment), fall back to 3000 locally
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server listening");
});
