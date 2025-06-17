import { consumer, producer } from '../../kafka/kafkaClient';
import { TOPICS } from '../../kafka/topics';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface VideoModerationMessage {
  debateId: string;
  userId: string;
  videoUrl: string;
  timestamp: number;
}

export async function startVideoModerationPipeline() {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: TOPICS.VIDEO_MODERATION });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const raw = JSON.parse(message.value.toString()) as VideoModerationMessage;
      console.log(`🎥 Received video moderation request for user: ${raw.userId}`);

      try {
        // 1. Download video
        const videoPath = path.resolve(__dirname, 'temp-video.mp4');
        const audioPath = path.resolve(__dirname, 'temp-audio.wav');

        // Download video file (similar to audio download logic)
        // You can use axios or any HTTP lib
        const axios = (await import('axios')).default;
        const writer = fs.createWriteStream(videoPath);
        const response = await axios.get(raw.videoUrl, { responseType: 'stream' });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // 2. Extract audio from video with ffmpeg
        // wav format recommended for ASR (speech recognition)
        await execAsync(`ffmpeg -y -i ${videoPath} -vn -acodec pcm_s16le -ar 44100 -ac 2 ${audioPath}`);

        // 3. Upload audio file to accessible location or encode to base64 if small
        // For demo, we assume local file accessible via URL or base64 encode here

        // Simple base64 encode (not recommended for large files, better upload to S3 or CDN)
        const audioBuffer = fs.readFileSync(audioPath);
        const audioBase64 = audioBuffer.toString('base64');

        // 4. Send message to AUDIO_MODERATION topic
        await producer.send({
          topic: TOPICS.AUDIO_MODERATION,
          messages: [
            {
              value: JSON.stringify({
                debateId: raw.debateId,
                userId: raw.userId,
                audioUrl: '', // if you uploaded, place URL here
                audioBase64,   // or embed base64 here (modify audio pipeline for this)
                timestamp: raw.timestamp,
              }),
            },
          ],
        });

        // 5. Cleanup
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

        console.log('🎥 Video processed and audio sent for moderation');

      } catch (err) {
        console.error('❌ Video moderation failed:', err);
        // Add retry or DLQ logic if needed
      }
    },
  });
}
