// import { consumer } from '../../kafka/kafkaClient';
// import { TOPICS } from '../../kafka/topics';
// import { AudioModerationMessage } from './types';
// import { transcribeAudio } from './audioTranscriber';
// import { moderateText } from '../text/mode';
// import { buildFeedback } from '../../feedback/ffeedbackHandler';
// import { dispatchFeedback } from '../../feedback/feedbackDispatcher';

// export async function startAudioModerationPipeline() {
 

//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       if (!message.value) return;
//       const raw = JSON.parse(message.value.toString()) as AudioModerationMessage;

//       console.log(`🎙️ Received audio for user ${raw.userId}`);
//       const text = await transcribeAudio(raw.audioUrl);
//       const result = await moderateText({
//         sessionId: raw.sessionId,
//         userId: raw.userId,
//         message: text,
//         timestamp: raw.timestamp,
//       });

//       if (result.flagged) {
//         const feedback = buildFeedback({
//           debateId: raw.debateId,
//           userId: raw.userId,
//           message: text,
//           score: result.toxicScore,
//           flagged: result.flagged,
//           timestamp: raw.timestamp,
//         });

//         await dispatchFeedback(feedback);
//       }
//     },
//   });
// }
