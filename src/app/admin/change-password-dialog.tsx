"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { changePasswordSchema, fieldErrors } from "@/lib/validation/auth";

type ChangePasswordDialogUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Botão que abre um dialog para redefinir a senha de um usuário.
 * A alteração é feita pelo plugin `admin()` do Better Auth (`setUserPassword`).
 */
export function ChangePasswordDialog({
  user,
  isSelf = false,
  onSuccess,
}: {
  user: ChangePasswordDialogUser;
  isSelf?: boolean;
  onSuccess?: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fieldId = `password-${user.id}`;

  function resetForm() {
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setFormError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    const parsed = changePasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);
    try {
      const result = await authClient.admin.setUserPassword({
        userId: user.id,
        newPassword: parsed.data.newPassword,
      });

      if (result.error) {
        setFormError(
          result.error.message ?? "Não foi possível alterar a senha",
        );
        return;
      }

      resetForm();
      setOpen(false);
      onSuccess?.(`Senha de ${user.email} atualizada.`);
    } catch {
      setFormError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <KeyRound data-icon="inline-start" />
        Alterar senha
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha de acesso para {user.name} ({user.email}).
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleChangePassword}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${fieldId}-new`}>Nova senha</Label>
              <Input
                id={`${fieldId}-new`}
                type="password"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby={
                  errors.newPassword ? `${fieldId}-new-error` : undefined
                }
              />
              {errors.newPassword ? (
                <p
                  id={`${fieldId}-new-error`}
                  className="text-sm text-destructive"
                >
                  {errors.newPassword}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${fieldId}-confirm`}>Confirmar senha</Label>
              <Input
                id={`${fieldId}-confirm`}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword
                    ? `${fieldId}-confirm-error`
                    : undefined
                }
              />
              {errors.confirmPassword ? (
                <p
                  id={`${fieldId}-confirm-error`}
                  className="text-sm text-destructive"
                >
                  {errors.confirmPassword}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 8 caracteres.
                </p>
              )}
            </div>

            {isSelf ? (
              <p className="text-xs text-muted-foreground">
                Você está alterando a sua própria senha. A sessão atual
                continua ativa.
              </p>
            ) : null}

            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
