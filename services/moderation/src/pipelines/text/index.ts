import { startTextModerationPipeline } from './textProcessor';

startTextModerationPipeline()
  .then(() => console.log('🧠 Text Moderation Pipeline running...'))
  .catch((err) => console.error('Failed to start pipeline:', err));
