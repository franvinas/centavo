"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, FileText, StickyNote, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { DeleteConfirmDrawer } from "@/components/ui/delete-confirm-drawer";
import { CategoryPicker } from "./category-picker";
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/actions/expenses";
import type { Category } from "@/types";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/constants";
import { parseLocalDate, formatNumber } from "@/lib/format";

interface ExpenseFormProps {
  expense?: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    date: string;
    notes?: string;
    categoryId: string;
  };
  categories: Category[];
  defaultCurrency?: string;
}

export function ExpenseForm({
  expense,
  categories,
  defaultCurrency = "USD",
}: ExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(expense?.amount.toFixed(2) ?? "");
  const [scale, setScale] = useState(1);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const measureRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currency, setCurrency] = useState(
    expense?.currency ?? defaultCurrency,
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [date, setDate] = useState(() => {
    // For existing expenses the date comes from the DB as UTC midnight,
    // so use parseLocalDate to avoid shifting a day in negative-offset TZs.
    // For new expenses just use the current local date.
    const d = expense?.date ? parseLocalDate(expense.date) : new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  });
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [error, setError] = useState("");
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
  const t = useTranslations("expenses");

  const [initial, setInitial] = useState({
    amount,
    currency,
    description,
    date,
    notes,
    categoryId,
  });
  const isDirty =
    JSON.stringify({
      amount,
      currency,
      description,
      date,
      notes,
      categoryId,
    }) !== JSON.stringify(initial);

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? "$";

  const displayAmount = amount
    ? amount.includes(".")
      ? formatNumber(parseFloat(amount.split(".")[0])) +
        "." +
        amount.split(".")[1]
      : formatNumber(parseFloat(amount))
    : "";

  const fullDisplay = displayAmount
    ? `${currencySymbol}${displayAmount}`
    : `${currencySymbol}0.00`;

  useEffect(() => {
    if (measureRef.current && containerRef.current) {
      const textWidth = measureRef.current.offsetWidth;
      const containerWidth = containerRef.current.offsetWidth;
      const maxWidth = containerWidth - 24;

      setMeasuredWidth(textWidth);

      if (textWidth > maxWidth && maxWidth > 0) {
        const newScale = Math.max(maxWidth / textWidth, 0.4);
        setScale(newScale);
      } else {
        setScale(1);
      }
    }
  }, [fullDisplay]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const isValid = amount && parseFloat(amount) > 0 && description && categoryId;

  function handleSave() {
    if (!isValid) return;

    setError("");
    startTransition(async () => {
      try {
        const data = {
          amount: parseFloat(amount),
          currency,
          description,
          categoryId,
          date,
          notes,
        };

        if (expense) {
          await updateExpense(expense.id, data);
        } else {
          await createExpense(data);
        }
        setInitial({
          amount,
          currency,
          description,
          date,
          notes,
          categoryId,
        });
        router.push("/dashboard");
      } catch {
        setError(t("saveError"));
      }
    });
  }

  function handleDelete() {
    setError("");
    startTransition(async () => {
      try {
        await deleteExpense(expense!.id);
        router.push("/expenses");
      } catch {
        setDeleteDrawerOpen(false);
        setError(t("deleteError"));
      }
    });
  }

  const fieldRow =
    "focus-within:bg-bg-muted/50 flex min-h-[56px] items-center gap-3 px-4 transition-colors";
  const fieldInput =
    "h-12 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0 md:h-12 md:text-[15px]";

  return (
    <div className="bg-bg-surface fixed inset-0 z-40 flex flex-col md:static md:z-auto md:block md:bg-transparent">
      <div className="md:border-border-subtle/60 md:bg-bg-surface md:shadow-elevated animate-page-in flex min-h-0 flex-1 flex-col md:mx-auto md:mt-2 md:max-w-[520px] md:rounded-3xl md:border">
        {/* Header */}
        <div className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-1 md:px-5 md:pt-5">
          <button
            onClick={() => router.back()}
            aria-label={t("close")}
            className="text-text-primary hover:bg-bg-muted active:bg-bg-muted flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <X className="h-[22px] w-[22px]" />
          </button>
          <h1 className="text-text-primary text-center text-base font-semibold">
            {expense ? t("editExpense") : t("addExpense")}
          </h1>
          <div />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 md:px-8">
          {/* Amount hero */}
          <div
            ref={containerRef}
            className="flex flex-col items-center pt-8 pb-7 md:pt-6"
          >
            {/* Hidden span for measuring full display width */}
            <span
              ref={measureRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-[-9999px] whitespace-pre"
              style={{ fontSize: "48px" }}
            >
              <span className="font-medium">{currencySymbol}</span>
              <span className="font-bold">{displayAmount || "0.00"}</span>
            </span>
            <label htmlFor="expense-amount" className="sr-only">
              {t("amount")}
            </label>
            {/* Centered amount display — tap anywhere to focus the hidden input */}
            <div
              className="flex w-full cursor-text justify-center"
              onClick={() => inputRef.current?.focus()}
            >
              <div
                className="relative flex items-baseline justify-center tabular-nums"
                style={{
                  width: measuredWidth > 0 ? `${measuredWidth}px` : "auto",
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                }}
              >
                <span className="text-text-tertiary text-5xl leading-none font-medium">
                  {currencySymbol}
                </span>
                <span className="text-text-primary text-5xl leading-none font-bold tracking-tight">
                  {displayAmount || (
                    <span className="text-border-subtle">0.00</span>
                  )}
                </span>
                {/* Invisible input overlaid to capture keyboard input */}
                <input
                  ref={inputRef}
                  id="expense-amount"
                  type="text"
                  inputMode="decimal"
                  value={displayAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/,/g, "");
                    // Up to 10 integer digits, matching the server's 9,999,999,999.99 cap.
                    if (/^\d{0,10}(\.\d{0,2})?$/.test(val)) setAmount(val);
                  }}
                  autoComplete="off"
                  className="absolute inset-0 caret-transparent opacity-0"
                  aria-label={t("amount")}
                />
              </div>
            </div>

            {/* Currency segmented control */}
            <div
              role="radiogroup"
              aria-label={t("currency")}
              className="bg-bg-muted mt-5 inline-flex rounded-full p-1"
            >
              {CURRENCIES.map((code) => {
                const active = currency === code;
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCurrency(code)}
                    className={`h-8 rounded-full px-4 text-[13px] font-semibold transition-all ${
                      active
                        ? "bg-bg-surface text-text-primary shadow-subtle"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <div className="border-border-subtle divide-border-subtle divide-y overflow-hidden rounded-2xl border">
            <div className={fieldRow}>
              <FileText className="text-text-tertiary h-5 w-5 shrink-0" />
              <Input
                placeholder={t("description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldInput}
              />
            </div>
            <div className={fieldRow}>
              <Calendar className="text-text-tertiary h-5 w-5 shrink-0" />
              <DatePicker
                value={date}
                onChange={setDate}
                showIcon={false}
                className="text-text-primary h-12 border-0 bg-transparent px-0 text-[15px] shadow-none hover:bg-transparent focus-visible:ring-0 has-[>svg]:px-0 md:h-12"
              />
            </div>
            <div className={fieldRow}>
              <CategoryPicker
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
              />
            </div>
            <div className={fieldRow}>
              <StickyNote className="text-text-tertiary h-5 w-5 shrink-0" />
              <Input
                placeholder={t("notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={fieldInput}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-8 md:pt-6 md:pb-8">
          {error && (
            <p
              role="alert"
              className="bg-status-negative/10 text-status-negative mb-3 rounded-xl px-4 py-3 text-center text-sm"
            >
              {error}
            </p>
          )}
          <Button
            onClick={handleSave}
            disabled={!isValid || isPending}
            className="bg-accent-primary hover:bg-accent-hover shadow-fab h-14 w-full rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-40 disabled:shadow-none md:h-12 md:rounded-xl"
          >
            {isPending
              ? t("saving")
              : expense
                ? t("updateExpense")
                : t("saveExpense")}
          </Button>
          {expense && (
            <>
              <Button
                variant="ghost"
                onClick={() => setDeleteDrawerOpen(true)}
                disabled={isPending}
                className="text-status-negative hover:bg-status-negative/10 hover:text-status-negative mt-2 h-12 w-full rounded-2xl text-[15px] font-semibold md:rounded-xl"
              >
                <Trash2 className="mr-1 h-[18px] w-[18px]" />
                {t("deleteExpense")}
              </Button>
              <DeleteConfirmDrawer
                open={deleteDrawerOpen}
                onOpenChange={setDeleteDrawerOpen}
                onConfirm={handleDelete}
                title={t("confirmDelete")}
                isDeleting={isPending}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
