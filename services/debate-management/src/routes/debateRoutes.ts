import express from 'express';
import {
  createDebate,
  getDebateById,
  listDebates,
  deleteDebate,
  getDebatesByUser,
  startDebate,
  endDebate,
  updateDebateConfig,
  requestMatchmaking,
} from '../controllers/debateController';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Swagger-style comment example
/**
 * @route POST /debate/create
 * @desc Create a new debate
 * @access Public
 */
router.post(
  '/create',
  body('title').isString().notEmpty(),
  body('duration').isInt({ min: 1 }),
  body('visibility').isIn(['PUBLIC', 'PRIVATE']),
  asyncHandler(createDebate)
);

router.post(
  '/create/matchmaking',

  body('userId').isString(),
  asyncHandler(requestMatchmaking)
)

router.get(
  '/detail/:id',
  param('id').isString(),
  asyncHandler(getDebateById)
);

router.get(
  '/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1 }),
  query('status').optional().isString(),
  asyncHandler(listDebates)
);

router.delete(
  '/:id',
  param('id').isString(),
  asyncHandler(deleteDebate)
);

router.get(
  '/user/:userId',
  param('userId').isString(),
  asyncHandler(getDebatesByUser)
);

router.post(
  '/:id/start',
  param('id').isString(),
  asyncHandler(startDebate)
);

router.post(
  '/:id/end',
  param('id').isString(),
  asyncHandler(endDebate)
);

router.put(
  '/:id/config',
  param('id').isString(),
  asyncHandler(updateDebateConfig)
);

export default router;