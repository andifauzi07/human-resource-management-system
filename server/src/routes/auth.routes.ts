import { Router } from "express";
import {
  hrdArea,
  login,
  logout,
  me,
  refresh
} from "../controllers/auth.controller";
import { originGuard } from "../middlewares/origin-guard";
import { authGuard, rbacGuard } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", login);
// Endpoint konsumen cookie refresh dilindungi originGuard (mitigasi CSRF
// karena cookie SameSite=None diizinkan lintas-situs).
router.post("/refresh", originGuard, refresh);
router.get("/me", authGuard, me);
router.post("/logout", originGuard, logout);
router.get("/hrd-area", authGuard, rbacGuard(["HRD"]), hrdArea);

export default router;
