import axios from 'axios';
import { TextModerationMessage } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.PERSPECTIVE_API_KEY;
const API_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${AIzaSyDt3s1p5HuHaqn8m7pn4iu-S5DwykwWiBU}`;

export async function moderateText(msg: TextModerationMessage): Promise<{
  toxicScore: number;
  flagged: boolean;
}> {
  // TODO: Replace this logic with actual model inference
  try {
    const response = await axios.post(API_URL, {
      comment: { text: msg.content },
      languages: ['en'],
      requestedAttributes: { TOXICITY: {} },
    });

    const score = response.data.attributeScores.TOXICITY.summaryScore.value;
    const flagged = score > 0.8;

    return { toxicScore: score, flagged };
  } catch (error:any) {
    console.error('Perspective API Error:', error.message);
    return { toxicScore: 0, flagged: false };
  }
}
