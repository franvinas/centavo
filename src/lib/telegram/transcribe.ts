import { getBot } from "@/lib/telegram/bot";
import { getOpenAI } from "@/lib/telegram/llm";

export async function transcribeVoice(fileId: string): Promise<string> {
  const bot = getBot();
  const file = await bot.api.getFile(fileId);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download voice file: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const audioFile = new File([buffer], "voice.ogg", {
    type: "audio/ogg",
  });

  const openai = getOpenAI();
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });

  return transcription.text;
}
