"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

import { invalidateAfterTransferMutation } from "~/lib/invalidate-finance-queries";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { formatCurrency, formatDate } from "~/lib/format";
import { api, type RouterOutputs } from "~/trpc/react";

type TransferRow = RouterOutputs["transfer"]["getAll"][number];
type Account = RouterOutputs["account"]["getAll"][number];

type TransfersManagerProps = {
  userId: string;
  initialTransfers: TransferRow[];
  initialAccounts: Account[];
};

const emptyForm = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  transactionDate: new Date().toISOString().slice(0, 10),
  note: "",
};

const toTrpcMessage = (error: { message?: string } | null): string | null => {
  if (!error?.message) return null;
  return error.message;
};

export const TransfersManager = ({
  userId,
  initialTransfers,
  initialAccounts,
}: TransfersManagerProps): React.ReactElement => {
  const utils = api.useUtils();

  const { data: transfers = initialTransfers } = api.transfer.getAll.useQuery(
    { userId, limit: 50 },
    { initialData: initialTransfers },
  );

  const { data: accounts = initialAccounts } = api.account.getAll.useQuery(
    { userId },
    { initialData: initialAccounts },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransferRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const createMutation = api.transfer.create.useMutation({
    onSuccess: async () => {
      await invalidateAfterTransferMutation(utils, userId);
      setCreateOpen(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = api.transfer.delete.useMutation({
    onSuccess: async () => {
      await invalidateAfterTransferMutation(utils, userId);
      setDeleteTarget(null);
    },
  });

  const openCreate = useCallback((): void => {
    setForm({ ...emptyForm, transactionDate: new Date().toISOString().slice(0, 10) });
    setCreateOpen(true);
  }, []);

  const submitCreate = (): void => {
    const amount = Number.parseFloat(form.amount);
    if (
      Number.isNaN(amount) ||
      amount <= 0 ||
      !form.fromAccountId ||
      !form.toAccountId ||
      form.fromAccountId === form.toAccountId
    ) {
      return;
    }
    createMutation.mutate({
      userId,
      fromAccountId: form.fromAccountId,
      toAccountId: form.toAccountId,
      amount,
      transactionDate: new Date(`${form.transactionDate}T12:00:00`),
      note: form.note.trim() || undefined,
    });
  };

  const createError = toTrpcMessage(createMutation.error);
  const deleteError = toTrpcMessage(deleteMutation.error);

  const createDisabled =
    createMutation.isPending ||
    !form.fromAccountId ||
    !form.toAccountId ||
    form.fromAccountId === form.toAccountId ||
    !form.amount;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {transfers.length} recent transfer{transfers.length !== 1 ? "s" : ""}
        </p>
        <Button
          id="xfer-add-btn"
          data-global-action="add"
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={openCreate}
        >
          <Plus className="size-4" />
          <span>New transfer</span>
        </Button>
      </div>

      {/* ── Transfer list ── */}
      {transfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <ArrowRight className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No transfers yet</p>
            <p className="text-xs text-muted-foreground mt-1">Move money between your accounts</p>
          </div>
          <Button type="button" size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" /> New transfer
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {transfers.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-xs transition-shadow hover:shadow-sm"
            >
              {/* Icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <ArrowRight className="size-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              </div>

              {/* Middle */}
              <div className="min-w-0 flex-1">
                {/* Account flow */}
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="truncate max-w-[90px]">{t.fromAccount.name}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[90px]">{t.toAccount.name}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{formatDate(t.transactionDate)}</span>
                  {t.note && (
                    <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">{t.note}</span>
                  )}
                </div>
              </div>

              {/* Right — amount + delete */}
              <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(Number(t.amount))}
                </span>
                <button
                  type="button"
                  aria-label="Delete transfer"
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(t)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent id="xfer-create-dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New transfer</DialogTitle>
            <DialogDescription>Debit from one account and credit another.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>From</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.fromAccountId || undefined}
                    onValueChange={(v) => setForm((f) => ({ ...f, fromAccountId: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>To</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.toAccountId || undefined}
                    onValueChange={(v) => setForm((f) => ({ ...f, toAccountId: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            {form.fromAccountId && form.toAccountId && form.fromAccountId === form.toAccountId && (
              <p className="text-destructive text-xs">From and to must be different accounts.</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="xfer-amount">Amount</FieldLabel>
                <FieldContent>
                  <Input
                    id="xfer-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="xfer-date">Date</FieldLabel>
                <FieldContent>
                  <Input
                    id="xfer-date"
                    type="date"
                    value={form.transactionDate}
                    onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="xfer-note">Note</FieldLabel>
              <FieldContent>
                <Input
                  id="xfer-note"
                  placeholder="Optional"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </FieldContent>
            </Field>

            {createError ? <FieldError>{createError}</FieldError> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="button" disabled={createDisabled} onClick={submitCreate}>
              {createMutation.isPending ? "Saving…" : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transfer?</AlertDialogTitle>
            <AlertDialogDescription>Balances will be reversed for both accounts.</AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? <p className="text-destructive text-sm">{deleteError}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate({ id: deleteTarget.id });
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
