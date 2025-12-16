import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

export class AuthController {
  // POST /auth/register
  static async register(req: Request, res: Response) {
    try {
      // Validate input
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        full_name: z.string().min(2),
        role: z.enum(['student', 'teacher']).optional()
      });
      const body = schema.parse(req.body);

      const result = await AuthService.register(body.email, body.password, body.full_name, body.role);
      res.status(201).json({ message: "Đăng ký thành công", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  // POST /auth/refresh-token
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) throw new Error("Thiếu refresh token");
      
      const result = await AuthService.refreshToken(refresh_token);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  // POST /auth/logout
  static async logout(req: Request, res: Response) {
      try {
          // Lấy token từ header để logout session đó
          const token = req.headers.authorization?.split(" ")[1];
          if(!token) throw new Error("Không tìm thấy token");
          
          await AuthService.logout(token);
          res.status(200).json({message: "Đăng xuất thành công"});
      } catch (error: any) {
          res.status(500).json({error: error.message});
      }
  }
}