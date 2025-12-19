import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service';
import { z } from 'zod';

export class ExamController {

  // POST /api/classrooms/:classId/exams
  static async createExam(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { classId } = req.params;

      const schema = z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        duration_minutes: z.number().min(1), // Ít nhất 1 phút
        passing_score: z.number().min(0)
      });

      const body = schema.parse(req.body);

      const result = await ExamService.createExam(userId, classId, body);
      res.status(201).json({ message: "Tạo đề thi thành công!", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /api/exams/:id/questions
  static async addQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params; // Exam ID

      const schema = z.object({
        content: z.string().min(1, "Nội dung câu hỏi không được trống"),
        // Validate JSON Options: Phải là mảng, mỗi phần tử có key và text
        options: z.array(z.object({
            key: z.string(), // "A", "B", "C", "D"
            text: z.string() // "Hà Nội", "Đà Nẵng"...
        })).min(2, "Phải có ít nhất 2 đáp án"),
        correct_option: z.string(),
        points: z.number().min(1)
      });

      const body = schema.parse(req.body);

      const result = await ExamService.addQuestion(userId, id, body);
      res.status(201).json({ message: "Thêm câu hỏi thành công!", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET /api/exams/:id
  static async getDetail(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = await ExamService.getExamDetail(id);
        res.status(200).json({ data: result });
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
  }

  static async getForStudent(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      
      const result = await ExamService.getExamForStudent(userId, id);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  // 👇 POST /api/exams/:id/submit (Nộp bài)
  static async submit(req: Request, res: Response) {
    try {
      const studentId = (req as any).user.id;
      const { id } = req.params; // Exam ID

      // Validate cấu trúc bài nộp
      const schema = z.object({
        answers: z.array(z.object({
          question_id: z.string(),
          selected_key: z.string() // "A" hoặc "B"...
        }))
      });

      const body = schema.parse(req.body);

      const result = await ExamService.submitExam(studentId, id, body.answers);
      
      res.status(200).json({ 
        message: "Nộp bài thành công!", 
        data: result 
      });

    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // 👇 PATCH /api/exams/:id/publish
  static async publish(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await ExamService.publishExam(userId, id);
      res.status(200).json({ message: "Đã công bố đề thi!", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}