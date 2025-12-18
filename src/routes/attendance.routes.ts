import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authenticate);

// 1. Giáo viên mở phiên điểm danh
// POST /api/classrooms/:classId/attendance-sessions
router.post('/classrooms/:classId/attendance-sessions', AttendanceController.createSession);

// 2. Học sinh check-in
// POST /api/attendance-sessions/:sessionId/check-in
router.post('/attendance-sessions/:sessionId/check-in', AttendanceController.checkIn);

// 3. Giáo viên xem danh sách đã điểm danh
// GET /api/attendance-sessions/:sessionId/records
router.get('/attendance-sessions/:sessionId/records', AttendanceController.listRecords);

// 4. Lấy danh sách các phiên điểm danh của lớp (Để lấy SESSION_ID)
router.get('/classrooms/:classId/attendance-sessions', AttendanceController.listSessions);
export default router;