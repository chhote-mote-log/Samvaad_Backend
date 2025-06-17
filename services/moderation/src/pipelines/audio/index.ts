import * as dotenv from 'dotenv';
dotenv.config();

import { startAudioModerationPipeline } from './audioProcessor';

startAudioModerationPipeline()
  .then(() => console.log('🎧 Audio Moderation Pipeline running...'))
  .catch(console.error);
