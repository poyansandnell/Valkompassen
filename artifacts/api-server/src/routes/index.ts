import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geoRouter from "./geo";
import quizRouter from "./quiz";
import partiesRouter from "./parties";
import resultPagesRouter from "./resultPages";
import challengesRouter from "./challenges";
import statsRouter from "./stats";
import supportRouter from "./support";
import partySubmissionsRouter from "./partySubmissions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geoRouter);
router.use(quizRouter);
router.use(partiesRouter);
router.use(resultPagesRouter);
router.use(challengesRouter);
router.use(statsRouter);
router.use(supportRouter);
router.use(partySubmissionsRouter);

export default router;
