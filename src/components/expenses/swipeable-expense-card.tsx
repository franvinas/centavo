"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Expense } from "@/types";
import { ExpenseCard } from "./expense-card";
import { DeleteConfirmDrawer } from "@/components/ui/delete-confirm-drawer";
import { deleteExpense } from "@/lib/actions/expenses";

interface SwipeableExpenseCardProps {
  expense: Expense;
}

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 100;

export function SwipeableExpenseCard({ expense }: SwipeableExpenseCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const t = useTranslations("expenses");

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTranslate = useRef(0);
  const isScrollingRef = useRef<boolean | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTranslate.current = translateX;
    isScrollingRef.current = null;
    setIsSwiping(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine scroll direction on first significant move
    if (isScrollingRef.current === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        isScrollingRef.current = true;
        return;
      }
      if (Math.abs(deltaX) > 10) {
        isScrollingRef.current = false;
        setIsSwiping(true);
      }
    }

    if (isScrollingRef.current) return;

    const newTranslate = Math.max(
      -MAX_SWIPE,
      Math.min(0, touchStartTranslate.current + deltaX),
    );
    setTranslateX(newTranslate);
  }

  function handleTouchEnd() {
    setIsSwiping(false);
    if (isScrollingRef.current) return;

    // Snap to revealed or closed position
    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-MAX_SWIPE);
      setIsRevealed(true);
    } else {
      setTranslateX(0);
      setIsRevealed(false);
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteExpense(expense.id);
      setDeleteDrawerOpen(false);
      router.refresh();
    });
  }

  function handleDeleteClick() {
    setDeleteDrawerOpen(true);
  }

  function handleCardClick() {
    // If revealed, close on tap instead of navigating
    if (isRevealed) {
      setTranslateX(0);
      setIsRevealed(false);
    }
  }

  return (
    <div className="relative overflow-hidden md:hidden">
      {/* Delete action background */}
      <div className="bg-status-negative absolute inset-y-0 right-0 flex w-[100px] items-center justify-center">
        <button
          onClick={handleDeleteClick}
          disabled={isPending}
          className="flex h-full w-full items-center justify-center"
          aria-label={t("deleteExpense")}
        >
          <Trash2 className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Swipeable card */}
      <div
        className="bg-bg-surface relative transition-transform ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: isSwiping ? "0ms" : "150ms",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <ExpenseCard expense={expense} />
      </div>

      <DeleteConfirmDrawer
        open={deleteDrawerOpen}
        onOpenChange={setDeleteDrawerOpen}
        onConfirm={handleDelete}
        title={t("confirmDelete")}
        isDeleting={isPending}
      />
    </div>
  );
}
