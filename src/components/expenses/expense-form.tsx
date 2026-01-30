"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  FileText,
  StickyNote,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryChip } from "./category-chip";
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/actions/expenses";
import type { Category } from "@/types";

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
}

export function ExpenseForm({ expense, categories }: ExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(expense?.amount.toFixed(2) ?? "");
  const [currency] = useState(expense?.currency ?? "USD");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [date, setDate] = useState(
    expense?.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 8);

  const isValid =
    amount && parseFloat(amount) > 0 && description && categoryId;

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
    startTransition(async () => {
      try {
        await deleteExpense(expense!.id);
        router.push("/expenses");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to delete expense");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => router.back()} aria-label="Close">
          <X className="h-6 w-6 text-text-primary" />
        </button>
        <h1 className="text-base font-semibold text-text-primary">
          {expense ? "Edit Expense" : "Add Expense"}
        </h1>
        <div className="w-6" />
      </div>

      <div className="flex flex-1 flex-col px-6">
        {/* Amount hero */}
        <div className="flex flex-col items-center py-8">
          <div className="flex items-baseline">
            <span className="text-lg text-text-tertiary">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
              }}
              placeholder="0.00"
              className="w-48 bg-transparent text-center text-5xl font-bold text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>
          <button
            type="button"
            className="mt-2 flex items-center gap-1 rounded-full bg-bg-muted px-3 py-1"
          >
            <span className="text-sm font-medium text-text-secondary">
              {currency}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-text-tertiary" />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-0 border-b border-border-subtle bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 shrink-0 text-text-tertiary" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-0 border-b border-border-subtle bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <StickyNote className="h-5 w-5 shrink-0 text-text-tertiary" />
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-0 border-b border-border-subtle bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Category selector */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-text-secondary">
            Category
          </p>
          <div className="grid grid-cols-4 gap-2">
            {visibleCategories.map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                selected={categoryId === cat.id}
                onSelect={setCategoryId}
              />
            ))}
          </div>
          {!showAllCategories && categories.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="mt-2 text-sm font-medium text-accent-primary"
            >
              More
            </button>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="px-6 pb-8 pt-4">
        <Button
          onClick={handleSave}
          disabled={!isValid || isPending}
          className="h-14 w-full rounded-md bg-accent-primary text-base font-semibold text-white hover:bg-accent-primary/90 disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : expense
              ? "Update Expense"
              : "Save Expense"}
        </Button>
        {expense && (
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="mt-3 h-12 w-full text-base font-semibold text-status-negative hover:bg-status-negative/10 hover:text-status-negative"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Delete Expense
          </Button>
        )}
      </div>
    </div>
  );
}
