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

// middlewares/auth.middleware.ts

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Không tìm thấy Access Token" });
    }

    const token = authHeader.split(" ")[1];
    
    // Gọi Supabase verify token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // 👇 SỬA ĐOẠN NÀY: Map lại user object cho gọn và đúng chuẩn middleware
    req.user = {
      id: user.id,
      email: user.email,
      // Lấy role từ metadata, nếu không có thì fallback về normal_user
      role: user.user_metadata?.role || 'normal_user', 
      // Giữ lại metadata gốc nếu cần dùng field khác
      meta: user.user_metadata 
    };
    
    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi xác thực hệ thống" });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Lấy user từ req (đã được middleware authenticate gán vào trước đó)
    const user = (req as any).user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: 'Forbidden: Bạn không có quyền truy cập tài nguyên này.',
      });
    }
    next();
  };
};