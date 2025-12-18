import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true }); 
// mergeParams: true giúp lấy được params từ router cha nếu có (nhưng ở đây mình define trực tiếp trong path nên không cần lắm, cứ để cho chắc)

router.use(authenticate);

// 1. Tạo bài giảng (Lưu ý đường dẫn có :classId)
// POST /api/classrooms/:classId/lessons
router.post('/classrooms/:classId/lessons', LessonController.create);

// 2. Lấy danh sách bài giảng
// GET /api/classrooms/:classId/lessons
router.get('/classrooms/:classId/lessons', LessonController.list);

export default router;