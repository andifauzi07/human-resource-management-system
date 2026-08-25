import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "./env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Baca swagger.json menggunakan fs
const swaggerDocPath = path.join(__dirname, "../docs/swagger.json");
const swaggerDocument = JSON.parse(
  fs.readFileSync(swaggerDocPath, "utf-8")
);

export const setupSwagger = (app: Express) => {
  if (env.NODE_ENV !== "development") return;
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};