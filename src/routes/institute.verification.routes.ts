import { Router } from 'express';
import { InstituteController } from '../controllers/institute.verification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// ============================
// PUBLIC ROUTES
// ============================
// GET /api/institute-verifications?page=1
router.get('/', InstituteController.getPublicList);

// 👇 [MỚI] GET /api/institute-verifications/detail/tech-master-2024
router.get('/detail/:slugOrId', InstituteController.getDetail);


// ============================
// AUTHENTICATED ROUTES
// ============================
router.use(authenticate);

// Register
router.post('/register', InstituteController.register);

// My Institutes
router.get('/my-institutes', InstituteController.getMyList);

// Resubmit
router.post('/:id/resubmit', InstituteController.resubmit);

// Update Info
router.put('/:id', InstituteController.updateInfo);


// ============================
// ADMIN ROUTES
// ============================
router.get('/admin/pending', authorizeRoles('admin'), InstituteController.getPendingList);
router.put('/admin/verify/:id', authorizeRoles('admin'), InstituteController.verifyProcess);

export default router;