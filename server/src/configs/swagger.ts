import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import env from "./env";
import swaggerDocument from "../docs/swagger.json" with { type: "json" };

const swaggerOptions = {
  customCssUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"
  ]
};

export const setupSwagger = (app: Express) => {
  // Kill-switch dokumentasi: flag nonaktif → route tidak dipasang →
  // request /api/docs jatuh ke notFoundHandler (404).
  if (!env.ENABLE_DOCS) return;

  app.use("/api/docs", (req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data:;"
    );
    next();
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerOptions)
  );
};
