import {
  getBooleanOption as readBooleanOption,
  getStringOption as readStringOption,
} from "../lib/helpers";
import {
  maybeConfirm as maybeConfirmHelper,
  resolveCategoryId as resolveCategoryIdHelper,
} from "../lib/helpers";
import { printTable } from "../lib/output";

export const getBooleanOption = readBooleanOption;
export const getStringOption = readStringOption;
export const resolveCategoryId = resolveCategoryIdHelper;
export const maybeConfirm = maybeConfirmHelper;

export function printCategoryTable(categories: Array<Record<string, unknown>>) {
  printTable(
    ["ID", "Name", "Color", "Icon", "Expenses"],
    categories.map((category) => [
      String(category.id),
      String(category.name),
      String(category.color ?? ""),
      String(category.icon ?? ""),
      String(
        (category._count as { expenses?: number } | undefined)?.expenses ?? "",
      ),
    ]),
  );
}
