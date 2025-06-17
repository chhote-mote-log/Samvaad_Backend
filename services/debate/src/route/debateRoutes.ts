//route/debateRoutes.ts
import express from 'express';
import  DebateController  from '../controller/debateController';

const router = express.Router();

router.post('/create', DebateController.createSession);
router.post('/:sessionId/start', DebateController.startSession);
router.post('/:sessionId/pause', DebateController.pauseSession);
router.post('/:sessionId/message', DebateController.addMessage);
router.post('/:sessionId/end', DebateController.endSession);
router.delete('/:sessionId/remove', DebateController.removeSession);
router.post('/:sessionId/participant', DebateController.addParticipant);
router.get('/:sessionId',DebateController.getSession);
router.post('/participant/connected', DebateController.markParticipantConnected);
router.post('/participant/disconnected', DebateController.markParticipantDisconnected);
router.get('/:sessionId/status', DebateController.getSessionStatus);

export default router;
