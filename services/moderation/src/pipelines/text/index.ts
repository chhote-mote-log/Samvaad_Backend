import { startTextModerationPipeline } from './textProcessor';
import { TextModerationMessage } from './types';

export async function runTextModerationPipeline(data: TextModerationMessage) {
  await startTextModerationPipeline(data)
    .then(() => console.log('🧠 Text Moderation Pipeline running...'))
    .catch((err) => console.error('Failed to start pipeline:', err));
}
