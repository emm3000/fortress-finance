import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.get('/', requireAuth, categoryController.getCategories);

export default router;
