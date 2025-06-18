// src/ingestion/validator/validator.ts
// src/ingestion/validator/validator.ts
import Joi from 'joi';
import { DebateMessage } from '../types';

const schema = Joi.object<DebateMessage>({
  debateId: Joi.string().required(),
  userId: Joi.string().required(),
  timestamp: Joi.number().required(),
  content: Joi.string().required(),
  contentType: Joi.string().valid('text', 'audio').required(),
});

export function validateMessage(message: any): { value?: DebateMessage; error?: string } {
  const { value, error } = schema.validate(message);
  return error ? { error: error.message } : { value };
}
