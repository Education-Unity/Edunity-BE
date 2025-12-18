import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authenticate);

// 1. Giáo viên giao bài tập (Gắn với Class ID)
// POST /api/classrooms/:classId/assignments
router.post('/classrooms/:classId/assignments', AssignmentController.create);

// 2. Lấy danh sách bài tập
// GET /api/classrooms/:classId/assignments
router.get('/classrooms/:classId/assignments', AssignmentController.list);

// 3. Học sinh nộp bài (Gắn với Assignment ID)
// POST /api/assignments/:id/submit
router.post('/assignments/:id/submit', AssignmentController.submit);

// 4. Giáo viên xem danh sách nộp bài (Gắn với Assignment ID)
router.get('/assignments/:id/submissions', AssignmentController.listSubmissions);

// 5. Giáo viên chấm điểm (Gắn với Submission ID - ID bài nộp)
// PUT /api/submissions/:id/grade
router.put('/submissions/:id/grade', AssignmentController.grade);
export default router;