'use client';

import { useState } from 'react';
import {
  Banknote,
  Bitcoin,
  CircleDollarSign,
  Coins,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';

import { AccountType } from '../../../../../generated/prisma';
import { formatCurrency } from '~/lib/format';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { api, type RouterOutputs } from '~/trpc/react';

type Account = RouterOutputs['account']['getAll'][number];

type AccountsInSettingsProps = {
  initialAccounts: Account[];
  userId: string;
};

const accountTypeConfig: Record<
  AccountType,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  [AccountType.cash]: { icon: Banknote, label: 'Cash' },
  [AccountType.bank]: { icon: CircleDollarSign, label: 'Bank' },
  [AccountType.crypto_wallet]: { icon: Bitcoin, label: 'Crypto Wallet' },
  [AccountType.gold_wallet]: { icon: Coins, label: 'Gold Wallet' },
  [AccountType.investment]: { icon: Wallet, label: 'Investment' },
};

const accountTypeOptions = Object.values(AccountType);

const toTrpcMessage = (error: { message?: string } | null): string | null => {
  if (!error?.message) return null;
  return error.message;
};

const emptyForm = {
  name: '',
  type: AccountType.cash as AccountType,
  currency: 'IDR',
  balance: '0',
};

export const AccountsInSettings = ({
  initialAccounts,
  userId,
}: AccountsInSettingsProps): React.ReactElement => {
  const utils = api.useUtils();

  const { data: accounts = initialAccounts } = api.account.getAll.useQuery(
    { userId },
    { initialData: initialAccounts },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const invalidate = async () => {
    await Promise.all([
      utils.account.getAll.invalidate({ userId }),
      utils.account.getTotalBalance.invalidate({ userId }),
    ]);
  };

  const createMutation = api.account.create.useMutation({
    onSuccess: async () => {
      await invalidate();
      setCreateOpen(false);
      setCreateForm(emptyForm);
    },
  });

  const updateMutation = api.account.update.useMutation({
    onSuccess: async () => {
      await invalidate();
      setEditTarget(null);
    },
  });

  const deleteMutation = api.account.delete.useMutation({
    onSuccess: async () => {
      await invalidate();
      setDeleteTarget(null);
    },
  });

  const openEdit = (account: Account): void => {
    setEditTarget(account);
    setEditForm({
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: String(Number(account.balance)),
    });
  };

  const submitCreate = (): void => {
    const balance = Number.parseFloat(createForm.balance);
    if (Number.isNaN(balance)) return;
    const currency = createForm.currency.trim();
    createMutation.mutate({
      userId,
      name: createForm.name.trim(),
      type: createForm.type,
      currency: currency.length > 0 ? currency : 'IDR',
      balance,
    });
  };

  const submitEdit = (): void => {
    if (!editTarget) return;
    const balance = Number.parseFloat(editForm.balance);
    if (Number.isNaN(balance)) return;
    const currency = editForm.currency.trim();
    updateMutation.mutate({
      id: editTarget.id,
      userId,
      name: editForm.name.trim(),
      type: editForm.type,
      currency: currency.length > 0 ? currency : 'IDR',
      balance,
    });
  };

  const createError = toTrpcMessage(createMutation.error);
  const updateError = toTrpcMessage(updateMutation.error);
  const deleteError = toTrpcMessage(deleteMutation.error);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {accounts.length} account{accounts.length !== 1 ? 's' : ''} configured
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No accounts yet.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const config =
              accountTypeConfig[account.type] ??
              accountTypeConfig[AccountType.cash];
            const Icon = config.icon;
            return (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-2.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(account.balance))} · {account.currency}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {config.label}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit account"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete account"
                    onClick={() => setDeleteTarget(account)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New account</DialogTitle>
            <DialogDescription>
              Add a bank account, wallet, or savings entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="settings-create-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="settings-create-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Main checking"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={createForm.type}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, type: v as AccountType }))
                  }
                >
                  <SelectTrigger id="settings-create-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {accountTypeConfig[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-create-currency">Currency</FieldLabel>
              <FieldContent>
                <Input
                  id="settings-create-currency"
                  value={createForm.currency}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  placeholder="IDR"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-create-balance">Initial balance</FieldLabel>
              <FieldContent>
                <Input
                  id="settings-create-balance"
                  type="number"
                  inputMode="decimal"
                  value={createForm.balance}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, balance: e.target.value }))
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
              disabled={createMutation.isPending || !createForm.name.trim()}
              onClick={submitCreate}
            >
              {createMutation.isPending ? 'Saving…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
            <DialogDescription>Update account details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="settings-edit-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="settings-edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={editForm.type}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, type: v as AccountType }))
                  }
                >
                  <SelectTrigger id="settings-edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {accountTypeConfig[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-edit-currency">Currency</FieldLabel>
              <FieldContent>
                <Input
                  id="settings-edit-currency"
                  value={editForm.currency}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, currency: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-edit-balance">Balance</FieldLabel>
              <FieldContent>
                <Input
                  id="settings-edit-balance"
                  type="number"
                  inputMode="decimal"
                  value={editForm.balance}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, balance: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            {updateError ? <FieldError>{updateError}</FieldError> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={updateMutation.isPending || !editForm.name.trim()}
              onClick={submitEdit}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will remove "${deleteTarget.name}". This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate({ id: deleteTarget.id, userId });
              }}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
