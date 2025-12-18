import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/auth.middleware'; // 👈 Import mới

const router = Router();

// Tất cả các route profile đều cần đăng nhập
router.use(authenticate);

// Các route cũ giữ nguyên
router.get('/me', ProfileController.getMe);
router.put('/me', ProfileController.updateMe);

// 👇 THÊM ROUTE NÀY VÀO CUỐI CÙNG 👇
// Chỉ Admin và Teacher mới được xem profile theo userId
router.get(
  '/:userId', 
  authorizeRoles('admin', 'teacher'), 
  ProfileController.getUserProfile
);

export default router;