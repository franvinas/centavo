import { Bot } from "grammy";

let bot: Bot | undefined;

export function getBot(): Bot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set");
    }
    bot = new Bot(token);
  }
  return bot;
}
