import { printKeyValue } from "../lib/output";
import {
  getBooleanOption as readBooleanOption,
  getStringOption as readStringOption,
} from "../lib/helpers";

export const getBooleanOption = readBooleanOption;
export const getStringOption = readStringOption;

export function printUserSettings(user: Record<string, unknown>) {
  printKeyValue([
    ["id", String(user.id)],
    ["email", String(user.email)],
    ["name", String(user.name ?? "")],
    ["baseCurrency", String(user.baseCurrency ?? "")],
    ["locale", String(user.locale ?? "")],
    ["timezone", String(user.timezone ?? "")],
    ["telegramLinked", user.telegramChatId ? "yes" : "no"],
  ]);
}
