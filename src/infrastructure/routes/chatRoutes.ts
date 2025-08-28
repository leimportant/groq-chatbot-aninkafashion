import { Router } from 'express';
import { chat } from '../../adapters/controllers/chatController';

const router = Router();

router.post('/chat', chat);

export default router;
