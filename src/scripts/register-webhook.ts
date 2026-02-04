import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_URL env vars.");
  process.exit(1);
}

async function main() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["message"],
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log("Webhook registered successfully:", WEBHOOK_URL);
  } else {
    console.error("Failed to register webhook:", data);
    process.exit(1);
  }
}

main();
