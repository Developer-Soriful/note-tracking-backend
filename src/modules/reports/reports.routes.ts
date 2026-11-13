import { Router } from "express";

import { reportsController } from "./reports.controller";
import {
  authenticate,
  authorize,
} from "../../shared/middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.use(authorize("admin"));

router.get("/users-by-interest", reportsController.getUsersByInterest);

export default router;

