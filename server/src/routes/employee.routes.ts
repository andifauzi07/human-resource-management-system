import { Router } from "express";
import {
  create,
  list,
  getMine,
  getById,
  update,
  remove,
  resetPassword
} from "../controllers/employee.controller";
import { authGuard, rbacGuard } from "../middlewares/auth.middleware";

const router = Router();

router.get("/mine", authGuard, getMine);
router.get("/", authGuard, rbacGuard(["HRD"]), list);
router.post("/", authGuard, rbacGuard(["HRD"]), create);
router.get("/:id", authGuard, getById);
router.patch("/:id", authGuard, rbacGuard(["HRD"]), update);
router.delete("/:id", authGuard, rbacGuard(["HRD"]), remove);
router.post(
  "/:id/reset-password",
  authGuard,
  rbacGuard(["HRD"]),
  resetPassword
);

export default router;
