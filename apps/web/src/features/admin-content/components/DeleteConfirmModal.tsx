import { useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

export type DeleteConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Sim, excluir",
  cancelLabel = "Cancelar",
  isPending = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl"
      >
        <h2 id="modal-title" className="text-lg font-bold text-foreground">
          {title}
        </h2>
        <p id="modal-description" className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            disabled={isPending}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Processando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
