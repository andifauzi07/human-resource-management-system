import { Router } from "express";
import {
  create,
  list,
  getById,
  update,
  remove
} from "../controllers/department.controller";
import { authGuard, rbacGuard } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authGuard, list);
router.post("/", authGuard, rbacGuard(["HRD"]), create);
router.get("/:id", authGuard, getById);
router.patch("/:id", authGuard, rbacGuard(["HRD"]), update);
router.delete("/:id", authGuard, rbacGuard(["HRD"]), remove);

export default router;
