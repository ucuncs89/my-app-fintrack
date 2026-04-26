"use client";

import { useState } from "react";
import {
  Banknote,
  Bitcoin,
  CircleDollarSign,
  Coins,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";

import { AccountType } from "../../../../../generated/prisma";
import { StatCard } from "~/components/ui/stat-card";
import { EmptyState } from "~/components/ui/empty-state";
import { FinancialDisplay } from "~/components/ui/financial-display";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
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
import { api, type RouterOutputs } from "~/trpc/react";

type Account = RouterOutputs["account"]["getAll"][number];

type AccountListProps = {
  initialAccounts: Account[];
  initialTotalBalance: RouterOutputs["account"]["getTotalBalance"];
  userId: string;
};

const accountTypeConfig: Record<
  AccountType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  [AccountType.cash]: { icon: Banknote, label: "Cash" },
  [AccountType.bank]: { icon: CircleDollarSign, label: "Bank" },
  [AccountType.crypto_wallet]: { icon: Bitcoin, label: "Crypto Wallet" },
  [AccountType.gold_wallet]: { icon: Coins, label: "Gold Wallet" },
  [AccountType.investment]: { icon: Wallet, label: "Investment" },
};

const accountTypeOptions = Object.values(AccountType);

const toTrpcMessage = (error: { message?: string } | null): string | null => {
  if (!error?.message) return null;
  return error.message;
};

const emptyForm = {
  name: "",
  type: AccountType.cash as AccountType,
  currency: "IDR",
  balance: "0",
};

export const AccountList = ({
  initialAccounts,
  initialTotalBalance,
  userId,
}: AccountListProps): React.ReactElement => {
  const utils = api.useUtils();

  const { data: accounts = initialAccounts } = api.account.getAll.useQuery(
    { userId },
    { initialData: initialAccounts },
  );

  const { data: totalBalance = initialTotalBalance } =
    api.account.getTotalBalance.useQuery(
      { userId },
      { initialData: initialTotalBalance },
    );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const createMutation = api.account.create.useMutation({
    onSuccess: async () => {
      await utils.account.getAll.invalidate({ userId });
      await utils.account.getTotalBalance.invalidate({ userId });
      setCreateOpen(false);
      setCreateForm(emptyForm);
    },
  });

  const updateMutation = api.account.update.useMutation({
    onSuccess: async () => {
      await utils.account.getAll.invalidate({ userId });
      await utils.account.getTotalBalance.invalidate({ userId });
      setEditTarget(null);
    },
  });

  const deleteMutation = api.account.delete.useMutation({
    onSuccess: async () => {
      await utils.account.getAll.invalidate({ userId });
      await utils.account.getTotalBalance.invalidate({ userId });
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
    const currencyTrimmed = createForm.currency.trim();
    createMutation.mutate({
      userId,
      name: createForm.name.trim(),
      type: createForm.type,
      currency: currencyTrimmed.length > 0 ? currencyTrimmed : "IDR",
      balance,
    });
  };

  const submitEdit = (): void => {
    if (!editTarget) return;
    const balance = Number.parseFloat(editForm.balance);
    if (Number.isNaN(balance)) return;
    const currencyTrimmed = editForm.currency.trim();
    updateMutation.mutate({
      id: editTarget.id,
      userId,
      name: editForm.name.trim(),
      type: editForm.type,
      currency: currencyTrimmed.length > 0 ? currencyTrimmed : "IDR",
      balance,
    });
  };

  const createError = toTrpcMessage(createMutation.error);
  const updateError = toTrpcMessage(updateMutation.error);
  const deleteError = toTrpcMessage(deleteMutation.error);

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2 mb-6">
        <Button data-global-action="add" type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add account
        </Button>
      </div>

      <div className="mb-6 sm:w-1/2 lg:w-1/3">
        <StatCard
          title="Total Balance"
          amount={Number(totalBalance)}
          icon={<Wallet className="size-4" />}
          className="shadow-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={Wallet}
              title="No accounts yet"
              description="Add your first bank account, wallet, or savings to start tracking."
              className="bg-card shadow-sm"
            />
          </div>
        ) : (
          accounts.map((account) => {
            const config =
              accountTypeConfig[account.type] ??
              accountTypeConfig[AccountType.cash];
            const Icon = config.icon;

            return (
              <Card key={account.id} className="glass card-hover border-transparent/5 shadow-sm transition-all overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-duration-500" />
                <div className="relative z-10">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1.5">
                        <Badge variant="secondary" className="font-normal text-[10px] px-2 py-0 uppercase tracking-widest text-muted-foreground bg-muted/50">
                          <Icon className="size-3 mr-1" />
                          {config.label}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit account"
                        onClick={() => openEdit(account)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete account"
                        onClick={() => setDeleteTarget(account)}
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <FinancialDisplay
                        amount={Number(account.balance)}
                        currency={account.currency}
                        showSign={false}
                        className="text-2xl font-bold"
                    />
                  </CardContent>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New account</DialogTitle>
            <DialogDescription>
              Create a bank account, wallet, or savings entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="create-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="create-name"
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
                  <SelectTrigger id="create-type">
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
              <FieldLabel htmlFor="create-currency">Currency</FieldLabel>
              <FieldContent>
                <Input
                  id="create-currency"
                  value={createForm.currency}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  placeholder="IDR"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="create-balance">Initial balance</FieldLabel>
              <FieldContent>
                <Input
                  id="create-balance"
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
              {createMutation.isPending ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <FieldLabel htmlFor="edit-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-name"
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
                  <SelectTrigger id="edit-type">
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
              <FieldLabel htmlFor="edit-currency">Currency</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-currency"
                  value={editForm.currency}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, currency: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-balance">Balance</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-balance"
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
              {updateMutation.isPending ? "Saving…" : "Save"}
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
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will remove “${deleteTarget.name}”. This cannot be undone.`
                : null}
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
                deleteMutation.mutate({
                  id: deleteTarget.id,
                  userId,
                });
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
