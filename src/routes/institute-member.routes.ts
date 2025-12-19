import { Router } from 'express';
import { InstituteMemberController } from '../controllers/institute-member.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authenticate);

// 1. Thêm thành viên
router.post('/institutesMember/:id/members', InstituteMemberController.addMember);

// 2. Lấy danh sách
router.get('/institutesMember/:id/members', InstituteMemberController.listMembers);

// 3. Xóa thành viên
router.delete('/institutesMember/:id/members/:userId', InstituteMemberController.removeMember);

// 4. Cập nhật thành viên (Dùng cái này để update role)
router.patch('/institutesMember/:id/members/:userId', InstituteMemberController.updateMember);

export default router;