import { Router } from "express";
import {
  hrdArea,
  login,
  logout,
  me,
  refresh,
  register
} from "../controllers/auth.controller";
import { authGuard, rbacGuard } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authGuard, me);
router.post("/logout", logout);
router.get("/hrd-area", authGuard, rbacGuard(["HRD"]), hrdArea);

export default router;
