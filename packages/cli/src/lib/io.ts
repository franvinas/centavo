import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import os from "node:os";

export async function confirm(message: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`${message} [y/N] `);
    return answer.trim().toLowerCase() === "y";
  } finally {
    rl.close();
  }
}

export async function prompt(message: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return (await rl.question(message)).trim();
  } finally {
    rl.close();
  }
}

export async function openBrowser(url: string) {
  const platform = os.platform();
  const command =
    platform === "darwin"
      ? ["open", url]
      : platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: "ignore",
      detached: true,
    });

    child.on("error", reject);
    child.unref();
    resolve();
  });
}
