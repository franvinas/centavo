"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteConfirmDrawer } from "@/components/ui/delete-confirm-drawer";
import { ColorPicker } from "@/components/expenses/color-picker";
import { IconPicker } from "@/components/expenses/icon-picker";
import { PageHeader } from "@/components/layout/page-header";
import {
  CategoryIcon,
  categoryTileStyle,
} from "@/components/categories/category-icon";
import { isValidCategoryIcon } from "@/lib/category-icon";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import type { Category } from "@/types";

interface CategoriesClientProps {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#E67E22");
  const [icon, setIcon] = useState("UtensilsCrossed");
  const [error, setError] = useState("");
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  );
  const t = useTranslations("categories");

  function openCreate() {
    setError("");
    setEditing(null);
    setName("");
    setColor("#E67E22");
    setIcon("UtensilsCrossed");
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setError("");
    setEditing(category);
    setName(category.name);
    setColor(category.color);
    // Legacy rows may hold free text; fall back to a valid icon so saving works.
    setIcon(
      isValidCategoryIcon(category.icon) ? category.icon : "MoreHorizontal",
    );
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;

    setError("");
    startTransition(async () => {
      try {
        if (editing) {
          await updateCategory(editing.id, { name, color, icon });
        } else {
          await createCategory({ name, color, icon });
        }
        setDialogOpen(false);
        router.refresh();
      } catch {
        setError(t("saveError"));
      }
    });
  }

  function openDeleteDrawer(id: string) {
    setDeletingCategoryId(id);
    setDeleteDrawerOpen(true);
  }

  function handleDelete() {
    if (!deletingCategoryId) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteCategory(deletingCategoryId);
        setDeleteDrawerOpen(false);
        setDeletingCategoryId(null);
        router.refresh();
      } catch {
        setDeleteDrawerOpen(false);
        setDeletingCategoryId(null);
        setError(t("deleteError"));
      }
    });
  }

  return (
    <div className="animate-page-in space-y-5 md:space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <DialogTrigger asChild>
              <Button
                onClick={openCreate}
                className="bg-accent-primary hover:bg-accent-hover h-10 rounded-xl px-4 font-semibold text-white md:h-10"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                {t("add")}
              </Button>
            </DialogTrigger>
          }
        />
        <DialogContent className="gap-5 rounded-3xl p-6 sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg">
              {editing ? t("editCategory") : t("newCategory")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {error && (
              <p
                role="alert"
                className="bg-status-negative/10 text-status-negative rounded-xl px-4 py-3 text-sm"
              >
                {error}
              </p>
            )}
            {/* Name field with live icon/color preview */}
            <div className="border-border-subtle focus-within:border-ring focus-within:ring-ring/50 flex items-center gap-3 rounded-2xl border p-2 pr-3 transition-shadow focus-within:ring-[3px]">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                style={categoryTileStyle(icon, color)}
                data-testid="category-preview"
              >
                <CategoryIcon icon={icon} color={color} />
              </div>
              <Input
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 border-0 bg-transparent px-0 text-[15px] font-medium shadow-none focus-visible:ring-0 md:h-10 md:text-[15px]"
              />
            </div>
            <div>
              <p className="text-text-tertiary mb-2.5 text-xs font-semibold tracking-wide uppercase">
                {t("color")}
              </p>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div>
              <p className="text-text-tertiary mb-2.5 text-xs font-semibold tracking-wide uppercase">
                {t("icon")}
              </p>
              <IconPicker value={icon} onChange={setIcon} color={color} />
            </div>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || isPending}
              className="bg-accent-primary hover:bg-accent-hover h-12 w-full rounded-xl text-[15px] font-semibold text-white md:h-11"
            >
              {isPending ? t("saving") : editing ? t("update") : t("create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {error && !dialogOpen && (
        <p
          role="alert"
          className="bg-status-negative/10 text-status-negative rounded-xl px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2 md:gap-3 xl:grid-cols-3">
        {initialCategories.map((cat) => {
          return (
            <div
              key={cat.id}
              className="group bg-bg-surface shadow-card border-border-subtle/60 flex items-center gap-3 rounded-2xl border py-3 pr-2 pl-3.5 transition-shadow hover:shadow-[0_1px_2px_#1a19180a,0_8px_24px_#1a19180f]"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={categoryTileStyle(cat.icon, cat.color)}
              >
                <CategoryIcon icon={cat.icon} color={cat.color} />
              </div>
              <span className="text-text-primary min-w-0 flex-1 truncate text-[15px] font-medium">
                {cat.name}
              </span>
              <button
                onClick={() => openEdit(cat)}
                className="text-text-tertiary hover:text-text-primary hover:bg-bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                aria-label={t("editNamed", { name: cat.name })}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => openDeleteDrawer(cat.id)}
                disabled={isPending}
                className="text-text-tertiary hover:text-status-negative hover:bg-status-negative/10 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                aria-label={t("deleteNamed", { name: cat.name })}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
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
