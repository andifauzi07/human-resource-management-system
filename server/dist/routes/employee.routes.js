import { Router } from "express";
import { create, list, getMine, getById, update, remove, resetPassword } from "../controllers/employee.controller.js";
import { authGuard, rbacGuard } from "../middlewares/auth.middleware.js";
const router = Router();
router.get("/mine", authGuard, getMine);
router.get("/", authGuard, list);
router.post("/", authGuard, rbacGuard(["HRD"]), create);
router.get("/:id", authGuard, rbacGuard(["HRD"]), getById);
router.patch("/:id", authGuard, rbacGuard(["HRD"]), update);
router.delete("/:id", authGuard, rbacGuard(["HRD"]), remove);
router.post("/:id/reset-password", authGuard, rbacGuard(["HRD"]), resetPassword);
export default router;
//# sourceMappingURL=employee.routes.js.map