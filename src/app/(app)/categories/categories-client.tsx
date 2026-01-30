"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ColorPicker } from "@/components/expenses/color-picker";
import { IconPicker } from "@/components/expenses/icon-picker";
import { categoryIconMap } from "@/lib/category-icon-map";
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

  function openCreate() {
    setEditing(null);
    setName("");
    setColor("#E67E22");
    setIcon("UtensilsCrossed");
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;

    startTransition(async () => {
      if (editing) {
        await updateCategory(editing.id, { name, color, icon });
      } else {
        await createCategory({ name, color, icon });
      }
      setDialogOpen(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCategory(id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to delete category");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-semibold">
            Categories
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Manage your expense categories
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="bg-accent-primary hover:bg-accent-primary/90 text-white"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Category" : "New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <p className="text-text-secondary mb-2 text-sm font-medium">
                  Color
                </p>
                <ColorPicker value={color} onChange={setColor} />
              </div>
              <div>
                <p className="text-text-secondary mb-2 text-sm font-medium">
                  Icon
                </p>
                <IconPicker value={icon} onChange={setIcon} color={color} />
              </div>
              <Button
                onClick={handleSave}
                disabled={!name.trim() || isPending}
                className="bg-accent-primary hover:bg-accent-primary/90 w-full text-white"
              >
                {isPending ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {initialCategories.map((cat) => {
          const Icon = categoryIconMap[cat.icon];
          return (
            <div
              key={cat.id}
              className="bg-bg-surface shadow-subtle flex items-center gap-3 rounded-lg p-4"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: cat.color + "1A" }}
              >
                {Icon && (
                  <Icon className="h-5 w-5" style={{ color: cat.color }} />
                )}
              </div>
              <span className="text-text-primary flex-1 text-sm font-medium">
                {cat.name}
              </span>
              <button
                onClick={() => openEdit(cat)}
                className="text-text-tertiary hover:text-text-secondary p-1.5"
                aria-label={`Edit ${cat.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={isPending}
                className="text-text-tertiary hover:text-status-negative p-1.5"
                aria-label={`Delete ${cat.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
