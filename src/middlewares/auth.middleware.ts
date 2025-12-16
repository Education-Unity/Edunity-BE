import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import prisma from '../config/prisma';

// Mở rộng kiểu Request để gắn user vào
declare global {
  namespace Express {
    interface Request {
      user?: any; // User từ Auth
      profile?: any; // Profile từ DB public
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Không tìm thấy Access Token" });
    }

    const token = authHeader.split(" ")[1];
    
    // Gọi Supabase để verify token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Gắn user vào request để các controller sau dùng
    req.user = user;
    
    // (Optional) Lấy luôn thông tin profile để tiện dùng
    // const profile = await prisma.profiles.findUnique({ where: { id: user.id } });
    // req.profile = profile;

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi xác thực hệ thống" });
  }
};