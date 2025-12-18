import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { z } from 'zod';

export class AttendanceController {

  // POST /api/classrooms/:classId/attendance-sessions
  static async createSession(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user.id;
      const { classId } = req.params;

      const schema = z.object({
        duration_minutes: z.number().min(1).max(180) // Mở tối đa 3 tiếng
      });

      const body = schema.parse(req.body);

      const result = await AttendanceService.createSession(teacherId, classId, body.duration_minutes);

      res.status(201).json({ message: "Đã mở điểm danh!", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /api/attendance-sessions/:sessionId/check-in
  static async checkIn(req: Request, res: Response) {
    try {
      const studentId = (req as any).user.id;
      const { sessionId } = req.params;

      const schema = z.object({
        location: z.any().optional() // JSON GPS (latitude, longitude)
      });
      const body = schema.parse(req.body);

      const result = await AttendanceService.checkIn(studentId, sessionId, body.location);

      res.status(200).json({ message: "Điểm danh thành công! ✅", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET /api/attendance-sessions/:sessionId/records
  static async listRecords(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user.id;
      const { sessionId } = req.params;

      const result = await AttendanceService.getSessionRecords(teacherId, sessionId);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  // 👇 GET /api/classrooms/:classId/attendance-sessions
  static async listSessions(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const sessions = await AttendanceService.getSessionsByClass(classId);
      res.status(200).json({ data: sessions });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}