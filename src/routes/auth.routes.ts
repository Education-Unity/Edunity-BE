import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import prisma from '../config/prisma'; // Tạm dùng prisma trực tiếp cho nhanh đoạn get me

const router = Router();

// Public Routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected Routes (Cần đăng nhập)
router.post('/logout', authenticate, AuthController.logout);

// API GET /auth/me (Lấy thông tin bản thân) - Thuộc Giai đoạn 0.2
router.get('/me', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.profiles.findUnique({
            where: { id: userId }
        });
        res.json({ user: req.user, profile });
    } catch (error) {
        res.status(500).json({message: "Lỗi lấy thông tin"});
    }
});

export default router;