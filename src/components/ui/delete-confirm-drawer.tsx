"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
}

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

// Bottom sheet on phones, centered dialog on larger screens.
function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => !!window.matchMedia?.(DESKTOP_QUERY).matches,
    () => false,
  );
}

export function DeleteConfirmDrawer({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  isDeleting = false,
}: DeleteConfirmDrawerProps) {
  const t = useTranslations("common");
  const isDesktop = useIsDesktop();

  const heading = title ?? t("deleteConfirmTitle");
  const body = description ?? t("deleteConfirmDescription");

  const confirmButton = (
    <Button
      variant="destructive"
      onClick={onConfirm}
      disabled={isDeleting}
      className="h-12 rounded-xl text-base font-semibold md:h-10 md:text-sm"
    >
      {isDeleting ? t("deleting") : t("delete")}
    </Button>
  );
  const cancelButton = (
    <Button
      variant="ghost"
      onClick={() => onOpenChange(false)}
      disabled={isDeleting}
      className="bg-bg-muted hover:bg-border-subtle h-12 rounded-xl text-base font-semibold md:h-10 md:text-sm"
    >
      {t("cancel")}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="gap-5 p-6 sm:max-w-sm"
        >
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="bg-status-negative/10 mb-2 flex h-12 w-12 items-center justify-center rounded-2xl">
              <Trash2 className="text-status-negative h-5 w-5" />
            </div>
            <DialogTitle className="text-base leading-snug">
              {heading}
            </DialogTitle>
            <DialogDescription>{body}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2.5">
            {cancelButton}
            {confirmButton}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="px-5 pt-5">
          <DrawerTitle className="text-lg">{heading}</DrawerTitle>
          <DrawerDescription>{body}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2.5 px-5 pb-6">
          {confirmButton}
          {cancelButton}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
