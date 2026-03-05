import { Router } from 'express';
import * as castleController from '../controllers/castle.controller';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.get('/', requireAuth, castleController.getCastleState);

export default router;
