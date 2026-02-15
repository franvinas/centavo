"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  FileText,
  StickyNote,
  ChevronDown,
  Trash2,
} from "lucide-react";
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
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
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

  const isDirty = Boolean(amount || description || notes || categoryId);

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

    startTransition(async () => {
      const data = {
        amount: parseFloat(amount),
        currency,
        description,
        categoryId,
        date,
        notes: notes || undefined,
      };

      if (expense) {
        await updateExpense(expense.id, data);
      } else {
        await createExpense(data);
      }
      router.push("/dashboard");
    });
  }

  function handleDelete() {
    setError("");
    startTransition(async () => {
      try {
        await deleteExpense(expense!.id);
        router.push("/expenses");
      } catch (e) {
        setDeleteDrawerOpen(false);
        setError(e instanceof Error ? e.message : "Failed to delete expense");
      }
    });
  }

  return (
    <div className="bg-bg-primary flex h-[100dvh] flex-col">
      <div
        ref={containerRef}
        className="bg-bg-surface shadow-card mx-auto w-full max-w-md rounded-lg p-5"
      >
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => router.back()} aria-label="Close">
            <X className="text-text-primary h-6 w-6" />
          </button>
          <h1 className="text-text-primary text-base font-semibold">
            {expense ? t("editExpense") : t("addExpense")}
          </h1>
          <div className="w-6" />
        </div>
        {/* Amount hero */}
        <div className="flex flex-col items-center py-4">
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
              className="relative flex items-baseline justify-center"
              style={{
                width: measuredWidth > 0 ? `${measuredWidth}px` : "auto",
                transform: `scale(${scale})`,
                transformOrigin: "center",
              }}
            >
              <span className="text-text-tertiary text-5xl leading-none font-medium">
                {currencySymbol}
              </span>
              <span className="text-text-primary text-5xl leading-none font-bold">
                {displayAmount || (
                  <span className="text-text-tertiary">0.00</span>
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
                  if (/^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
                }}
                autoComplete="off"
                className="absolute inset-0 caret-transparent opacity-0"
                aria-label={t("amount")}
              />
            </div>
          </div>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => setShowCurrencyPicker((v) => !v)}
              className="bg-bg-muted flex items-center gap-1 rounded-full px-3 py-1"
            >
              <span className="text-text-secondary text-sm font-medium">
                {currency}
              </span>
              <ChevronDown className="text-text-tertiary h-3.5 w-3.5" />
            </button>
            {showCurrencyPicker && (
              <div className="bg-bg-surface border-border-subtle absolute top-full z-10 mt-1 flex flex-wrap gap-1.5 rounded-xl border p-3 shadow-lg">
                {CURRENCIES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setCurrency(code);
                      setShowCurrencyPicker(false);
                    }}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      currency === code
                        ? "bg-accent-primary text-white"
                        : "bg-bg-muted text-text-secondary hover:bg-border-subtle"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="text-text-tertiary h-5 w-5 shrink-0" />
            <Input
              placeholder={t("description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-border-subtle border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-text-tertiary h-5 w-5 shrink-0" />
            <DatePicker
              value={date}
              onChange={setDate}
              className="border-border-subtle border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <StickyNote className="text-text-tertiary h-5 w-5 shrink-0" />
            <Input
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-border-subtle border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <CategoryPicker
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
        </div>

        {/* Save button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!isValid || isPending}
            className="bg-accent-primary hover:bg-accent-primary/90 h-14 w-full rounded-md text-base font-semibold text-white disabled:opacity-50"
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
                className="text-status-negative hover:bg-status-negative/10 hover:text-status-negative mt-3 h-12 w-full text-base font-semibold"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                {t("deleteExpense")}
              </Button>
              {error && (
                <p
                  role="alert"
                  className="text-status-negative mt-2 text-center text-sm"
                >
                  {error}
                </p>
              )}
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
