import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authenticate);

// 1. Thống kê tổng quan (Giáo viên)
router.get('/classrooms/:classId/stats/overview', StatsController.getOverview);

// 2. Bảng xếp hạng (Ai cũng xem được để đua top)
router.get('/classrooms/:classId/stats/leaderboard', StatsController.getLeaderboard);

export default router;