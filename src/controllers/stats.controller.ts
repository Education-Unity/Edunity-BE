import { Request, Response } from 'express';
import { StatsService } from '../services/stats.service';

export class StatsController {

  // GET /api/classrooms/:classId/stats/overview
  static async getOverview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { classId } = req.params;

      const result = await StatsService.getClassOverview(userId, classId);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET /api/classrooms/:classId/stats/leaderboard
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      
      const result = await StatsService.getLeaderboard(classId);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}