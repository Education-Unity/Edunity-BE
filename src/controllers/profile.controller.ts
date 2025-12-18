import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { z } from 'zod';

export class ProfileController {
  
  // GET /api/profiles/me
  static async getMe(req: Request, res: Response) {
    try {
      const userId = req.user.id; // Lấy từ middleware authenticate
      const profile = await ProfileService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  // PUT /api/profiles/me
  static async updateMe(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      // Validate dữ liệu đầu vào
      const schema = z.object({
        full_name: z.string().min(2).optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().optional(),
        avatar_url: z.string().url().optional()
      });
      
      const body = schema.parse(req.body);

      const updatedProfile = await ProfileService.updateProfile(userId, body);
      res.status(200).json({ 
        message: "Cập nhật thành công", 
        data: updatedProfile 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params; 
      
      // Tái sử dụng hàm getProfile có sẵn bên Service
      const profile = await ProfileService.getProfile(userId);
      
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}