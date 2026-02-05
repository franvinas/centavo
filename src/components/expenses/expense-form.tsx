"use client";

import { useEffect, useState, useTransition } from "react";
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
import { CategoryPicker } from "./category-picker";
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/actions/expenses";
import type { Category } from "@/types";
import { CURRENCIES } from "@/lib/constants";
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
  const t = useTranslations("expenses");

  const isDirty = Boolean(amount || description || notes || categoryId);

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
    if (!window.confirm(t("confirmDelete"))) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteExpense(expense!.id);
        router.push("/expenses");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete expense");
      }
    });
  }

  return (
    <div className="bg-bg-surface flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => router.back()} aria-label="Close">
          <X className="text-text-primary h-6 w-6" />
        </button>
        <h1 className="text-text-primary text-base font-semibold">
          {expense ? t("editExpense") : t("addExpense")}
        </h1>
        <div className="w-6" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        {/* Amount hero */}
        <div className="flex flex-col items-center py-8">
          <div className="flex items-baseline">
            <label htmlFor="expense-amount" className="sr-only">
              {t("amount")}
            </label>
            <span className="text-text-tertiary text-lg">$</span>
            <input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              value={
                amount
                  ? amount.includes(".")
                    ? formatNumber(parseFloat(amount.split(".")[0])) +
                      "." +
                      amount.split(".")[1]
                    : formatNumber(parseFloat(amount))
                  : ""
              }
              onChange={(e) => {
                const val = e.target.value.replace(/,/g, "");
                if (/^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
              }}
              placeholder="0.00"
              autoComplete="off"
              className="text-text-primary placeholder:text-text-tertiary w-48 bg-transparent text-center text-5xl font-bold outline-none"
            />
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
        <div className="space-y-4">
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
      </div>

      {/* Save button */}
      <div className="mx-auto w-full max-w-md px-6 pt-4 pb-8">
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
              onClick={handleDelete}
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
          </>
        )}
      </div>
    </div>
  );
}
