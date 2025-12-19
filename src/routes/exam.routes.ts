import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authenticate);

// 1. Tạo Đề thi (Gắn với Class)
router.post('/classrooms/:classId/exams', ExamController.createExam);

// 2. Thêm Câu hỏi (Gắn với Exam)
router.post('/exams/:id/questions', ExamController.addQuestion);

// 3. Xem chi tiết đề thi (Gồm cả câu hỏi)
router.get('/exams/:id', ExamController.getDetail);

// 4. Học sinh lấy đề để làm (Đề đã che đáp án)
router.get('/exams/:id/take', ExamController.getForStudent);

// 5. Học sinh nộp bài
router.post('/exams/:id/submit', ExamController.submit);

router.patch('/exams/:id/publish', ExamController.publish);
export default router;