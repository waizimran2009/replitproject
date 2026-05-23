import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emailRouter from "./email";
import callsRouter from "./calls";
import postsRouter from "./posts";
import atsRouter from "./ats";
import interviewsRouter from "./interviews";
import attendanceRouter from "./attendance";
import leaveRouter from "./leave";
import hrAnalyticsRouter from "./hr-analytics";
import employeesRouter from "./employees";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/email", emailRouter);
router.use("/calls", callsRouter);
router.use("/posts", postsRouter);
router.use("/ats", atsRouter);
router.use("/interviews", interviewsRouter);
router.use("/attendance", attendanceRouter);
router.use("/leave", leaveRouter);
router.use("/hr-analytics", hrAnalyticsRouter);
router.use("/employees", employeesRouter);

export default router;
