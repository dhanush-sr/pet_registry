import { Router, type IRouter } from "express";
import healthRouter from "./health";
import petsRouter from "./pets";
import vetAuthRouter from "./vet-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vetAuthRouter);
router.use(petsRouter);

export default router;
