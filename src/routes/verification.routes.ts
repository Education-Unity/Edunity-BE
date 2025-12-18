import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/auth.middleware'; // Import thêm cái này

const router = Router();

// Tất cả các API này đều yêu cầu phải đăng nhập trước
router.use(authenticate);

// 1. User gửi yêu cầu xác thực (Ai cũng gửi được, miễn là đã login)
router.post('/', VerificationController.submitRequest);

// 2. Admin xem danh sách đơn chờ (Chỉ Admin)
router.get(
  '/', 
  authorizeRoles('admin'), 
  VerificationController.listPendingRequests
);

// 3. Admin duyệt hoặc từ chối đơn (Chỉ Admin)
router.put(
  '/:id', 
  authorizeRoles('admin'), 
  VerificationController.processRequest
);

export default router;