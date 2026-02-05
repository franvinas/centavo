"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface DeleteConfirmDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title ?? t("deleteConfirmTitle")}</DrawerTitle>
          <DrawerDescription>
            {description ?? t("deleteConfirmDescription")}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-3">
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-12 text-base font-semibold"
          >
            {isDeleting ? t("deleting") : t("delete")}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-12 text-base font-semibold"
          >
            {t("cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
