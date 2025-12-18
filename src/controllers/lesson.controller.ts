import { Request, Response } from 'express';
import { LessonService } from '../services/lesson.service';
import { z } from 'zod';

export class LessonController {

  // POST /api/classrooms/:classId/lessons
  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { classId } = req.params;

      // Validate input
      const schema = z.object({
        title: z.string().min(3, "Tiêu đề bài học quá ngắn"),
        content: z.string().optional(),
        video_url: z.string().url("Link video không hợp lệ").optional().or(z.literal('')) // Cho phép rỗng
      });

      const body = schema.parse(req.body);

      const result = await LessonService.createLesson(userId, classId, body);

      res.status(201).json({
        message: "Tạo bài giảng thành công!",
        data: result
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  // GET /api/classrooms/:classId/lessons
  static async list(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const lessons = await LessonService.getLessonsByClass(classId);
      
      res.status(200).json({ data: lessons });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}