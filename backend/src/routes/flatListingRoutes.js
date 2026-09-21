import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireDb } from '../middleware/requireDb.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getFlatListings,
  createFlatListing,
  updateFlatListing,
  deactivateFlatListing,
  deleteFlatListing,
  cleanAllFlatListings,
} from '../controllers/flatListingController.js';

const router = Router();

router.use(requireDb, requireAuth);

router.delete('/clean/all', requireRole(['salesman', 'employee', 'admin']), asyncHandler(cleanAllFlatListings));
router.get('/', requireRole(['salesman', 'employee', 'admin']), asyncHandler(getFlatListings));
router.post('/', requireRole(['salesman', 'employee', 'admin']), asyncHandler(createFlatListing));
router.put('/:id', requireRole(['salesman', 'employee', 'admin']), asyncHandler(updateFlatListing));
router.patch('/:id', requireRole(['salesman', 'employee', 'admin']), asyncHandler(deactivateFlatListing));
router.delete('/:id', requireRole(['salesman', 'employee', 'admin']), asyncHandler(deleteFlatListing));

export default router;
