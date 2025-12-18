import { Router } from 'express';
import { ClassroomController } from '../controllers/classroom.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', ClassroomController.create);

router.get('/', ClassroomController.list);


router.get('/:id', ClassroomController.getDetail);

router.post('/:id/join', ClassroomController.join);

router.get('/:id/members', ClassroomController.listMembers);
export default router;