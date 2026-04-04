"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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
    setForm({
      ...emptyForm,
      transactionDate: new Date().toISOString().slice(0, 10),
    });
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
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Transfers</CardTitle>
          <CardDescription>
            Move money between your accounts ({transfers.length} recent)
          </CardDescription>
        </div>
        <Button type="button" size="sm" className="shrink-0" onClick={openCreate}>
          <Plus className="size-4" />
          New transfer
        </Button>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            No transfers yet.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right w-[72px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.transactionDate)}</TableCell>
                    <TableCell>{t.fromAccount.name}</TableCell>
                    <TableCell>{t.toAccount.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {t.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(t.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete transfer"
                        onClick={() => setDeleteTarget(t)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New transfer</DialogTitle>
            <DialogDescription>
              Debit from one account and credit another.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel>From account</FieldLabel>
              <FieldContent>
                <Select
                  value={form.fromAccountId || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, fromAccountId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>To account</FieldLabel>
              <FieldContent>
                <Select
                  value={form.toAccountId || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, toAccountId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            {form.fromAccountId &&
            form.toAccountId &&
            form.fromAccountId === form.toAccountId ? (
              <p className="text-destructive text-sm">
                From and to must be different accounts.
              </p>
            ) : null}
            <Field>
              <FieldLabel htmlFor="xfer-amount">Amount</FieldLabel>
              <FieldContent>
                <Input
                  id="xfer-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      transactionDate: e.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="xfer-note">Note</FieldLabel>
              <FieldContent>
                <Input
                  id="xfer-note"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            {createError ? <FieldError>{createError}</FieldError> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createDisabled}
              onClick={submitCreate}
            >
              {createMutation.isPending ? "Saving…" : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transfer?</AlertDialogTitle>
            <AlertDialogDescription>
              Balances will be reversed for both accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="text-destructive text-sm">{deleteError}</p>
          ) : null}
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
    </Card>
  );
};
