import { OpenAI } from "openai";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(
  audioUrl?: string,
  audioBase64?: string
): Promise<string> {
  // Download audio from URL (assumes .mp3 or .wav)
  const filePath = path.resolve(__dirname, "temp-audio.mp3");

  if (audioBase64) {
    // Write base64 buffer to file
    const buffer = Buffer.from(audioBase64, "base64");
    fs.writeFileSync(filePath, buffer);
  } else if (audioUrl) {
    const writer = fs.createWriteStream(filePath);

    const response = await axios.get(audioUrl, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } else {
    throw new Error("No audio data provided");
  }
  // Transcribe using Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
  });

  fs.unlinkSync(filePath); // Cleanup
  return transcription.text;
}
