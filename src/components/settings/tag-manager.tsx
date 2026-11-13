"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Hash, Pencil, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { DeleteConfirmDrawer } from "@/components/ui/delete-confirm-drawer";
import { deleteTag, renameTag } from "@/lib/actions/tags";
import { formatCurrency } from "@/lib/format";
import { MAX_TAG_LENGTH, normalizeTagName } from "@/lib/validations/tag";

export interface TagSummary {
  id: string;
  name: string;
  expenseCount: number;
  total: number;
  currency: string;
  pendingConversionCount: number;
}

export function TagManager({ tags }: { tags: TagSummary[] }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<TagSummary | null>(null);
  const [error, setError] = useState("");

  const normalizedDraft = normalizeTagName(draft);
  const mergeTarget = tags.find(
    (tag) => tag.id !== editingId && tag.name === normalizedDraft,
  );

  function startEditing(tag: TagSummary) {
    setError("");
    setEditingId(tag.id);
    setDraft(tag.name);
  }

  function handleRename() {
    if (!editingId || !normalizedDraft) return;
    const id = editingId;
    setError("");
    startTransition(async () => {
      try {
        await renameTag(id, normalizedDraft);
        setEditingId(null);
        router.refresh();
      } catch {
        setError(t("tagError"));
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const id = deleting.id;
    setError("");
    startTransition(async () => {
      try {
        await deleteTag(id);
        setDeleting(null);
        router.refresh();
      } catch {
        setDeleting(null);
        setError(t("tagError"));
      }
    });
  }

  if (tags.length === 0) {
    return <p className="text-text-tertiary text-sm">{t("noTags")}</p>;
  }

  return (
    <div>
      <ul className="divide-border-subtle -mx-1 divide-y" data-slot="tag-list">
        {tags.map((tag) =>
          editingId === tag.id ? (
            <li key={tag.id} className="px-1 py-2.5">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRename();
                }}
              >
                <div className="relative min-w-0 flex-1">
                  <Hash className="text-text-tertiary pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4" />
                  <Input
                    autoFocus
                    value={draft}
                    maxLength={MAX_TAG_LENGTH + 1}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    aria-label={t("tagName")}
                    autoCapitalize="none"
                    className="border-border-subtle h-10 rounded-xl pl-9"
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !normalizedDraft ||
                    normalizedDraft.length > MAX_TAG_LENGTH
                  }
                  aria-label={t("saveTag")}
                  className="bg-accent-primary hover:bg-accent-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label={t("cancel")}
                  className="text-text-secondary hover:bg-bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
              {mergeTarget && (
                <p role="status" className="text-text-secondary mt-2 text-xs">
                  {t("mergeWarning", { tag: mergeTarget.name })}
                </p>
              )}
            </li>
          ) : (
            <li key={tag.id} className="flex items-center gap-2 px-1 py-2">
              <Link
                href={`/expenses?tags=${encodeURIComponent(tag.name)}`}
                aria-label={t("viewTagExpenses", { tag: tag.name })}
                className="hover:bg-bg-muted -my-1 min-w-0 flex-1 rounded-lg px-2 py-1.5"
              >
                <p className="text-text-primary truncate text-[15px] font-medium">
                  <span className="text-text-tertiary">#</span>
                  {tag.name}
                </p>
                <p className="text-text-tertiary text-xs tabular-nums">
                  {t("tagExpenses", { count: tag.expenseCount })}
                  {tag.expenseCount > 0 && (
                    <>
                      {" · "}
                      <span className="text-text-secondary font-medium">
                        {formatCurrency(tag.total, tag.currency)}
                      </span>
                    </>
                  )}
                  {tag.pendingConversionCount > 0 && (
                    <span className="text-status-negative">
                      {" · "}
                      {t("tagPending", { count: tag.pendingConversionCount })}
                    </span>
                  )}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => startEditing(tag)}
                disabled={isPending}
                aria-label={t("renameTag", { tag: tag.name })}
                className="text-text-secondary hover:bg-bg-muted hover:text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setDeleting(tag);
                }}
                disabled={isPending}
                aria-label={t("deleteTag", { tag: tag.name })}
                className="text-status-negative hover:bg-status-negative/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ),
        )}
      </ul>

      {error && (
        <p role="alert" className="text-status-negative mt-2 text-sm">
          {error}
        </p>
      )}

      <DeleteConfirmDrawer
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={handleDelete}
        title={t("confirmDeleteTag", { tag: deleting?.name ?? "" })}
        description={t("confirmDeleteTagHint", {
          count: deleting?.expenseCount ?? 0,
        })}
        isDeleting={isPending}
      />
    </div>
  );
}
