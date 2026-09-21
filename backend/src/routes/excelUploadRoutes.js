import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireDb } from '../middleware/requireDb.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  uploadExcelFlatListings,
  getExcelUploadHistory,
  pushFlatListingData,
} from '../controllers/excelUploadController.js';
import { uploadBase64ToImageKit, uploadUrlToImageKit } from '../utils/imagekit.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.use(requireDb, requireAuth);

const ALLOWED_UPLOAD_ROLES = ['admin', 'employee', 'staff', 'salesman'];

router.post('/bulk-upload', requireRole(ALLOWED_UPLOAD_ROLES), upload.single('file'), asyncHandler(uploadExcelFlatListings));
router.post('/upload', requireRole(ALLOWED_UPLOAD_ROLES), upload.single('file'), asyncHandler(uploadExcelFlatListings));
router.post('/push', requireRole(ALLOWED_UPLOAD_ROLES), asyncHandler(pushFlatListingData));
router.post('/image', requireRole(ALLOWED_UPLOAD_ROLES), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const url = await uploadBase64ToImageKit(req.file.buffer.toString('base64'), req.file.originalname || `img-${Date.now()}`);
    if (!url) return res.status(500).json({ error: 'ImageKit upload failed' });
    res.status(200).json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));
router.post('/image-from-url', requireRole(ALLOWED_UPLOAD_ROLES), asyncHandler(async (req, res) => {
  const { url, fileName } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const result = await uploadUrlToImageKit(url, fileName || `img-${Date.now()}`);
    if (!result) return res.status(500).json({ error: 'ImageKit upload failed' });
    res.status(200).json({ url: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));
router.get('/flat-listings', requireRole(ALLOWED_UPLOAD_ROLES), asyncHandler(getExcelUploadHistory));

export default router;
