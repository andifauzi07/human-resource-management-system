import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { notFoundHandler } from "./middlewares/not-found-handler";
import { errorHandler } from "./middlewares/error-handler";
import { setupSwagger } from "./configs/swagger";
import authRoutes from "./routes/auth.routes";
import env from "./configs/env";
import { logger } from "./utils/logger";
import { configureGracefulShutdown } from "./utils/shutdown";

import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

const app: Express = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map(o => o.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  })
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com"
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com"
        ],
        "img-src": ["'self'", "data:", "https://cdnjs.cloudflare.com"]
      }
    }
  })
);
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

app.get("/", (_, res) => {
  res.send("Hai ini dari vercell !!!");
});

//? Swagger Setup
setupSwagger(app);
app.use("/api/v1/auth", authRoutes);

// Not found handler (should be after routes)
app.use(notFoundHandler);

// Global error handler (should be last)
app.use(errorHandler);

// Bind port HANYA saat di luar Vercel — di serverless platform mengeksekusi
// modul ini tanpa listener (env VERCEL=1 diset otomatis oleh Vercel).
if (!process.env.VERCEL) {
  const port = env.PORT || 9000;
  const server = app.listen(port, () => {
    logger.info(`[server]: Server is running at http://localhost:${port}`);
    logger.info(`[server]: Environment: ${env.NODE_ENV}`);
    logger.info(
      `[server]: Swagger docs are available at http://localhost:${port}/api/docs`
    );
  });
  configureGracefulShutdown(server);
}

export default app;
