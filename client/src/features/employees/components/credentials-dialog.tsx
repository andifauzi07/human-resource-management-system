import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EmployeeCredentials } from "../types";

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  credentials: EmployeeCredentials | null;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CredentialsDialog({
  open,
  onOpenChange,
  title,
  description,
  credentials
}: CredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(
    null
  );

  function resetCopied() {
    setCopiedField(null);
  }

  async function handleCopy(field: "email" | "password", value: string) {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopiedField(field);
      toast.success(`${field === "email" ? "Email" : "Password"} disalin`);
    } else {
      toast.error("Gagal menyalin ke clipboard");
    }
  }

  if (!credentials) return null;

  const rows: { key: "email" | "password"; label: string; value: string }[] = [
    { key: "email", label: "Email", value: credentials.email },
    { key: "password", label: "Password", value: credentials.password }
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetCopied();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid gap-3">
          {rows.map(({ key, label, value }) => (
            <div key={key} className="grid gap-1.5">
              <span className="text-sm font-medium">{label}</span>
              <div className="border-input bg-muted/40 flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-sm">{value}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Salin ${label}`}
                  onClick={() => handleCopy(key, value)}
                >
                  {copiedField === key ? <Check /> : <Copy />}
                  {copiedField === key ? "Tersalin" : "Salin"}
                </Button>
              </div>
            </div>
          ))}
          <p className="text-muted-foreground text-xs">
            Kredensial ini hanya ditampilkan sekali. Simpan sebelum menutup dialog.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}