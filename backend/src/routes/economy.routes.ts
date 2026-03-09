import { Router } from 'express';
import * as shopController from '../controllers/shop.controller';
import * as inventoryController from '../controllers/inventory.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import { purchaseSchema, equipSchema } from '../validations/economy.validation';

const router = Router();

// Shop (browse catalog)
router.get('/shop', requireAuth, shopController.getShopItems);

// Inventory (owned items)
router.get('/inventory', requireAuth, inventoryController.getMyInventory);
router.post(
  '/inventory/purchase',
  requireAuth,
  validate(purchaseSchema),
  inventoryController.purchaseItem,
);
router.post('/inventory/equip', requireAuth, validate(equipSchema), inventoryController.equipItem);

export default router;
