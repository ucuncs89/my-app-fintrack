"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, Pencil, Plus, Trash2, ArrowUpRight } from "lucide-react";

import { type CategoryType, TransactionType } from "../../../../../generated/prisma";
import { invalidateAfterTransactionMutation } from "~/lib/invalidate-finance-queries";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { formatCurrency, formatDate } from "~/lib/format";
import { api, type RouterOutputs } from "~/trpc/react";

const FILTER_ALL = "__all__";
const CATEGORY_NONE = "__none__";

type TxPage = RouterOutputs["transaction"]["getAll"];
type TransactionRow = TxPage["transactions"][number];
type Account = RouterOutputs["account"]["getAll"][number];
type Category = RouterOutputs["category"]["getAll"][number];

type TransactionsManagerProps = {
  userId: string;
  initialTransactionPage: TxPage;
  initialAccounts: Account[];
  initialCategories: Category[];
};

type TxRowConfig = {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sign: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

const defaultTxConfig: TxRowConfig = {
  icon: ArrowUpRight,
  color: "text-red-600",
  sign: "-",
  label: "Expense",
  variant: "destructive",
};

const typeConfig: Record<string, TxRowConfig> = {
  income: {
    icon: ArrowDownLeft,
    color: "text-green-600",
    sign: "+",
    label: "Income",
    variant: "secondary",
  },
  expense: defaultTxConfig,
  transfer: {
    icon: ArrowLeftRight,
    color: "text-blue-600",
    sign: "",
    label: "Transfer",
    variant: "outline",
  },
  investment: {
    icon: ArrowUpRight,
    color: "text-amber-600",
    sign: "-",
    label: "Investment",
    variant: "default",
  },
};

const transactionTypeOptions = Object.values(TransactionType);

type TxFormState = {
  type: TransactionType;
  accountId: string;
  categoryId: string;
  amount: string;
  transactionDate: string;
  note: string;
};

const emptyForm = (): TxFormState => ({
  type: TransactionType.expense,
  accountId: "",
  categoryId: CATEGORY_NONE,
  amount: "",
  transactionDate: new Date().toISOString().slice(0, 10),
  note: "",
});

const toTrpcMessage = (error: { message?: string } | null): string | null => {
  if (!error?.message) return null;
  return error.message;
};

export const TransactionsManager = ({
  userId,
  initialTransactionPage,
  initialAccounts,
  initialCategories,
}: TransactionsManagerProps): React.ReactElement => {
  const utils = api.useUtils();

  const [typeFilter, setTypeFilter] = useState<string>(FILTER_ALL);
  const [accountFilter, setAccountFilter] = useState<string>(FILTER_ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(FILTER_ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const listInput = useMemo(() => {
    const search =
      debouncedSearch.length > 0 ? debouncedSearch : undefined;
    const start =
      startDate.length > 0
        ? new Date(`${startDate}T00:00:00`)
        : undefined;
    const end =
      endDate.length > 0 ? new Date(`${endDate}T23:59:59.999`) : undefined;

    return {
      userId,
      limit: 50,
      ...(typeFilter !== FILTER_ALL && {
        type: typeFilter as TransactionType,
      }),
      ...(accountFilter !== FILTER_ALL && { accountId: accountFilter }),
      ...(categoryFilter !== FILTER_ALL && { categoryId: categoryFilter }),
      ...(start && { startDate: start }),
      ...(end && { endDate: end }),
      ...(search && { search }),
    };
  }, [
    userId,
    typeFilter,
    accountFilter,
    categoryFilter,
    startDate,
    endDate,
    debouncedSearch,
  ]);

  const isDefaultFilters =
    typeFilter === FILTER_ALL &&
    accountFilter === FILTER_ALL &&
    categoryFilter === FILTER_ALL &&
    startDate === "" &&
    endDate === "" &&
    debouncedSearch === "";

  const infinite = api.transaction.getAll.useInfiniteQuery(listInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialCursor: undefined,
    initialData: isDefaultFilters
      ? {
          pages: [initialTransactionPage],
          pageParams: [undefined],
        }
      : undefined,
  });

  const transactions = useMemo(
    () => infinite.data?.pages.flatMap((p) => p.transactions) ?? [],
    [infinite.data],
  );

  const { data: accounts = initialAccounts } = api.account.getAll.useQuery(
    { userId },
    { initialData: initialAccounts },
  );

  const { data: categories = initialCategories } = api.category.getAll.useQuery(
    { userId },
    { initialData: initialCategories },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TransactionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [form, setForm] = useState<TxFormState>(() => emptyForm());

  const formCategoryType = form.type as unknown as CategoryType;

  const { data: formCategories = [] } = api.category.getByType.useQuery(
    { userId, type: formCategoryType },
    { enabled: createOpen || !!editTarget },
  );

  const createMutation = api.transaction.create.useMutation({
    onSuccess: async () => {
      await invalidateAfterTransactionMutation(utils, userId);
      setCreateOpen(false);
      setForm(emptyForm());
    },
  });

  const updateMutation = api.transaction.update.useMutation({
    onSuccess: async () => {
      await invalidateAfterTransactionMutation(utils, userId);
      setEditTarget(null);
    },
  });

  const deleteMutation = api.transaction.delete.useMutation({
    onSuccess: async () => {
      await invalidateAfterTransactionMutation(utils, userId);
      setDeleteTarget(null);
    },
  });

  const openCreate = useCallback((): void => {
    setForm(emptyForm());
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((tx: TransactionRow): void => {
    setEditTarget(tx);
    const d = new Date(tx.transactionDate);
    const iso = Number.isNaN(d.getTime())
      ? new Date().toISOString().slice(0, 10)
      : d.toISOString().slice(0, 10);
    setForm({
      type: tx.type,
      accountId: tx.accountId,
      categoryId: tx.categoryId ?? CATEGORY_NONE,
      amount: String(Number(tx.amount)),
      transactionDate: iso,
      note: tx.note ?? "",
    });
  }, []);

  const submitCreate = (): void => {
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0 || !form.accountId) return;
    createMutation.mutate({
      userId,
      accountId: form.accountId,
      type: form.type,
      amount,
      transactionDate: new Date(`${form.transactionDate}T12:00:00`),
      note: form.note.trim() || undefined,
      ...(form.categoryId !== CATEGORY_NONE && { categoryId: form.categoryId }),
    });
  };

  const submitEdit = (): void => {
    if (!editTarget) return;
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0 || !form.accountId) return;

    const categoryPayload =
      form.categoryId === CATEGORY_NONE
        ? { categoryId: null as string | null }
        : { categoryId: form.categoryId };

    updateMutation.mutate({
      id: editTarget.id,
      userId,
      accountId: form.accountId,
      type: form.type,
      amount,
      transactionDate: new Date(`${form.transactionDate}T12:00:00`),
      note: form.note.trim() ? form.note.trim() : null,
      ...categoryPayload,
    });
  };

  const createError = toTrpcMessage(createMutation.error);
  const updateError = toTrpcMessage(updateMutation.error);
  const deleteError = toTrpcMessage(deleteMutation.error);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {transactions.length} loaded
            {infinite.hasNextPage ? " — more available" : ""}
          </CardDescription>
        </div>
        <Button type="button" size="sm" className="shrink-0" onClick={openCreate}>
          <Plus className="size-4" />
          Add transaction
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldContent>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All types</SelectItem>
                  {transactionTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeConfig[t]?.label ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Account</FieldLabel>
            <FieldContent>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All accounts</SelectItem>
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
            <FieldLabel>Category</FieldLabel>
            <FieldContent>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="tx-filter-start">From</FieldLabel>
            <FieldContent>
              <Input
                id="tx-filter-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="tx-filter-end">To</FieldLabel>
            <FieldContent>
              <Input
                id="tx-filter-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="tx-filter-search">Search note</FieldLabel>
            <FieldContent>
              <Input
                id="tx-filter-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search…"
              />
            </FieldContent>
          </Field>
        </div>

        {transactions.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            No transactions match your filters.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const config = typeConfig[tx.type] ?? defaultTxConfig;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.note ?? tx.category?.name ?? config.label}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>{tx.category?.name ?? "-"}</TableCell>
                      <TableCell>{tx.account.name}</TableCell>
                      <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                      <TableCell
                        className={cn("text-right font-semibold", config.color)}
                      >
                        {config.sign}
                        {formatCurrency(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit"
                            onClick={() => openEdit(tx)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete"
                            onClick={() => setDeleteTarget(tx)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {infinite.hasNextPage ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={infinite.isFetchingNextPage}
              onClick={() => void infinite.fetchNextPage()}
            >
              {infinite.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New transaction</DialogTitle>
            <DialogDescription>
              Income increases balance; expense and investment decrease it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      type: v as TransactionType,
                      categoryId: CATEGORY_NONE,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeConfig[t]?.label ?? t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Account</FieldLabel>
              <FieldContent>
                <Select
                  value={form.accountId || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, accountId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
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
              <FieldLabel>Category</FieldLabel>
              <FieldContent>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, categoryId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CATEGORY_NONE}>None</SelectItem>
                    {formCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-create-amount">Amount</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-create-amount"
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
              <FieldLabel htmlFor="tx-create-date">Date</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-create-date"
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, transactionDate: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-create-note">Note</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-create-note"
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
              disabled={
                createMutation.isPending ||
                !form.accountId ||
                !form.amount
              }
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
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Update fields and save.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      type: v as TransactionType,
                      categoryId: CATEGORY_NONE,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeConfig[t]?.label ?? t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Account</FieldLabel>
              <FieldContent>
                <Select
                  value={form.accountId || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, accountId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <FieldLabel>Category</FieldLabel>
              <FieldContent>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, categoryId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CATEGORY_NONE}>None</SelectItem>
                    {formCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-edit-amount">Amount</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-edit-amount"
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
              <FieldLabel htmlFor="tx-edit-date">Date</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-edit-date"
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, transactionDate: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-edit-note">Note</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-edit-note"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
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
              disabled={
                updateMutation.isPending ||
                !editTarget ||
                !form.accountId ||
                !form.amount
              }
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
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? "This will reverse the effect on your account balance."
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
    </Card>
  );
};
