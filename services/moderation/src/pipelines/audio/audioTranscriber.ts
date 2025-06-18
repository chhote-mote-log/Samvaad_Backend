import { OpenAI } from "openai";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(
  audioUrl?: string,
  audioBase64?: string
): Promise<string> {
  const filePath = path.resolve(__dirname, "temp-audio.mp3");

  if (audioBase64) {
    const buffer = Buffer.from(audioBase64, "base64");
    fs.writeFileSync(filePath, buffer);
  } else if (audioUrl) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(audioUrl, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", () => resolve());
      writer.on("error", (err) => reject(err));
    });
  } else {
    throw new Error("No audio data provided");
  }

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
  });

  fs.unlinkSync(filePath);
  return transcription.text;
}
