import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { z } from 'zod';

export class AssignmentController {

  // POST /api/classrooms/:classId/assignments
  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { classId } = req.params;

      const schema = z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        due_date: z.string().datetime().optional(), // Nhận chuỗi ISO 8601
        max_score: z.number().optional()
      });

      const body = schema.parse(req.body);

      // Convert string date sang Date object nếu có
      const dueDate = body.due_date ? new Date(body.due_date) : undefined;

      const result = await AssignmentService.createAssignment(userId, classId, {
        ...body,
        due_date: dueDate
      });

      res.status(201).json({ message: "Giao bài tập thành công!", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Lỗi tạo bài tập" });
    }
  }

  // GET /api/classrooms/:classId/assignments
  static async list(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const result = await AssignmentService.getAssignmentsByClass(classId);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  // POST /api/assignments/:id/submit (Lưu ý: ID ở đây là assignment_id)
  static async submit(req: Request, res: Response) {
    try {
      const studentId = (req as any).user.id;
      const { id } = req.params; // Assignment ID

      const schema = z.object({
        content: z.string().optional(),
        file_urls: z.array(z.string().url()).optional() // Mảng các link file
      });

      const body = schema.parse(req.body);

      const result = await AssignmentService.submitAssignment(studentId, id, body);

      res.status(201).json({ message: "Nộp bài thành công!", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Lỗi nộp bài" });
    }
  }

  static async listSubmissions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params; // Assignment ID

      const submissions = await AssignmentService.getSubmissionsForAssignment(userId, id);
      
      res.status(200).json({ data: submissions });
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  }

  // 👇 [PUT] /api/submissions/:id/grade
  static async grade(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user.id;
      const { id } = req.params; // Submission ID (ID bài nộp, KHÔNG PHẢI assignment id)

      const schema = z.object({
        grade: z.number().min(0).max(100), // Điểm từ 0-100 (tuỳ thang điểm bạn muốn)
        feedback: z.string().optional()
      });

      const body = schema.parse(req.body);

      const result = await AssignmentService.gradeSubmission(teacherId, id, body);

      res.status(200).json({
        message: "Chấm điểm thành công!",
        data: result
      });

    } catch (error: any) {
      res.status(400).json({ error: error.message || "Lỗi chấm điểm" });
    }
  }
}