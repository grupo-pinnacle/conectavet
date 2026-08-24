import { Router, Response } from 'express';
import { authenticate, RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { upload } from './media.service';
import { uploadImageController, handleUploadErrors } from './media.controller';

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadImageController);
router.use((err: Error, req: RequestWithUser, res: Response, next: (e: Error) => unknown) =>
  handleUploadErrors(err, req, res, next)
);

export default router;