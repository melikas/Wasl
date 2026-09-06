import { Router, type IRouter } from "express";
import healthRouter from "./health";
import waslRouter from "./wasl";

const router: IRouter = Router();

router.use(healthRouter);
router.use(waslRouter);

export default router;
