"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Filter,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

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
// import { Badge } from "~/components/ui/badge";
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
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/format";
import { api, type RouterOutputs } from "~/trpc/react";
import { FinancialDisplay } from "~/components/ui/financial-display";
import { EmptyState } from "~/components/ui/empty-state";

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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  bgColor: string;
  iconColor: string;
  amountColor: string;
  sign: string;
  label: string;
  badgeClass: string;
};

const defaultTxConfig: TxRowConfig = {
  icon: ArrowUpRight,
  bgColor: "bg-red-100 dark:bg-red-900/30",
  iconColor: "text-red-600 dark:text-red-400",
  amountColor: "text-red-600 dark:text-red-400",
  sign: "-",
  label: "Expense",
  badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const typeConfig: Record<string, TxRowConfig> = {
  income: {
    icon: ArrowDownLeft,
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    sign: "+",
    label: "Income",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  expense: defaultTxConfig,
  transfer: {
    icon: ArrowLeftRight,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    amountColor: "text-blue-600 dark:text-blue-400",
    sign: "",
    label: "Transfer",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  investment: {
    icon: ArrowUpRight,
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    amountColor: "text-amber-600 dark:text-amber-400",
    sign: "-",
    label: "Investment",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
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

// ─── Transaction Card (mobile-first row) ──────────────────────────────────────
function TransactionCard({
  tx,
  onEdit,
  onDelete,
}: {
  tx: TransactionRow;
  onEdit: (tx: TransactionRow) => void;
  onDelete: (tx: TransactionRow) => void;
}) {
  const config = typeConfig[tx.type] ?? defaultTxConfig;
  const Icon = config.icon;
  const label = tx.note ?? tx.category?.name ?? config.label;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-xs transition-shadow hover:shadow-sm">
      {/* Type icon */}
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", config.bgColor)}>
        <Icon className={cn("size-5", config.iconColor)} strokeWidth={2} />
      </div>

      {/* Middle — label + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", config.badgeClass)}>
            {config.label}
          </span>
          {tx.category?.name && tx.note && (
            <span className="text-[11px] text-muted-foreground">{tx.category.name}</span>
          )}
          <span className="text-[11px] text-muted-foreground">{tx.account.name}</span>
          <span className="text-[11px] text-muted-foreground">{formatDate(tx.transactionDate)}</span>
        </div>
      </div>

      {/* Right — amount + actions */}
      <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
        <FinancialDisplay
          amount={tx.amount}
          type={tx.type === 'transfer' ? 'neutral' : tx.type === 'investment' ? 'expense' : tx.type}
          showSign={tx.type !== 'transfer'}
          className={cn("text-sm", config.amountColor)}
        />
        <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label="Edit transaction"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => onEdit(tx)}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Delete transaction"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(tx)}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export const TransactionsManager = ({
  userId,
  initialTransactionPage,
  initialAccounts,
  initialCategories,
}: TransactionsManagerProps): React.ReactElement => {
  const utils = api.useUtils();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>(FILTER_ALL);
  const [accountFilter, setAccountFilter] = useState<string>(FILTER_ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(FILTER_ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isDefaultFilters =
    typeFilter === FILTER_ALL &&
    accountFilter === FILTER_ALL &&
    categoryFilter === FILTER_ALL &&
    startDate === "" &&
    endDate === "" &&
    debouncedSearch === "";

  const activeFilterCount = [
    typeFilter !== FILTER_ALL,
    accountFilter !== FILTER_ALL,
    categoryFilter !== FILTER_ALL,
    startDate !== "",
    endDate !== "",
    debouncedSearch !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTypeFilter(FILTER_ALL);
    setAccountFilter(FILTER_ALL);
    setCategoryFilter(FILTER_ALL);
    setStartDate("");
    setEndDate("");
    setSearchInput("");
  };

  const listInput = useMemo(() => {
    const search = debouncedSearch.length > 0 ? debouncedSearch : undefined;
    const start = startDate.length > 0 ? new Date(`${startDate}T00:00:00`) : undefined;
    const end = endDate.length > 0 ? new Date(`${endDate}T23:59:59.999`) : undefined;

    return {
      userId,
      limit: 50,
      ...(typeFilter !== FILTER_ALL && { type: typeFilter as TransactionType }),
      ...(accountFilter !== FILTER_ALL && { accountId: accountFilter }),
      ...(categoryFilter !== FILTER_ALL && { categoryId: categoryFilter }),
      ...(start && { startDate: start }),
      ...(end && { endDate: end }),
      ...(search && { search }),
    };
  }, [userId, typeFilter, accountFilter, categoryFilter, startDate, endDate, debouncedSearch]);

  const infinite = api.transaction.getAll.useInfiniteQuery(listInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialCursor: undefined,
    initialData: isDefaultFilters
      ? { pages: [initialTransactionPage], pageParams: [undefined] }
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

  // Dialogs
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Top bar: search + filter toggle + add ── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="tx-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search transactions…"
            className="pl-9 pr-4"
          />
          {searchInput && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchInput("")}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <Button
          id="tx-filter-toggle"
          type="button"
          variant={filtersOpen || activeFilterCount > 0 ? "default" : "outline"}
          size="sm"
          className="relative shrink-0 gap-1.5"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex size-[18px] items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Add button */}
        <Button
          id="tx-add-btn"
          type="button"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={openCreate}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {/* ── Collapsible filter panel ── */}
      {filtersOpen && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Filter className="size-3.5" />
              Filters
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                <X className="size-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-xs">
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
            </div>

            {/* Account */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Account</label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All accounts</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <Input
                id="tx-filter-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Date to */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <Input
                id="tx-filter-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && !filtersOpen && (
        <div className="flex flex-wrap gap-2">
          {typeFilter !== FILTER_ALL && (
            <span className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              {typeConfig[typeFilter]?.label ?? typeFilter}
              <button onClick={() => setTypeFilter(FILTER_ALL)} className="ml-0.5 hover:text-destructive"><X className="size-3" /></button>
            </span>
          )}
          {accountFilter !== FILTER_ALL && (
            <span className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              {accounts.find((a) => a.id === accountFilter)?.name ?? "Account"}
              <button onClick={() => setAccountFilter(FILTER_ALL)} className="ml-0.5 hover:text-destructive"><X className="size-3" /></button>
            </span>
          )}
          {categoryFilter !== FILTER_ALL && (
            <span className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              {categories.find((c) => c.id === categoryFilter)?.name ?? "Category"}
              <button onClick={() => setCategoryFilter(FILTER_ALL)} className="ml-0.5 hover:text-destructive"><X className="size-3" /></button>
            </span>
          )}
          {startDate && (
            <span className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              From {startDate}
              <button onClick={() => setStartDate("")} className="ml-0.5 hover:text-destructive"><X className="size-3" /></button>
            </span>
          )}
          {endDate && (
            <span className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              To {endDate}
              <button onClick={() => setEndDate("")} className="ml-0.5 hover:text-destructive"><X className="size-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Transaction count ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {transitions_count_label(transactions.length, infinite.hasNextPage)}
        </span>
        {infinite.isFetching && !infinite.isFetchingNextPage && (
          <span className="animate-pulse">Updating…</span>
        )}
      </div>

      {/* ── Transaction list ── */}
      {transactions.length === 0 ? (
        <EmptyState
            icon={ArrowLeftRight}
            title="No transactions found"
            description={activeFilterCount > 0 ? "Try adjusting your filters" : "Add your first transaction to start tracking"}
            className="border-none"
            action={activeFilterCount === 0 ? (
              <Button type="button" onClick={openCreate} className="gap-1.5 shadow-md">
                <Plus className="size-4" /> Add transaction
              </Button>
            ) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              tx={tx}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* ── Load more ── */}
      {infinite.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full max-w-xs gap-1.5"
            disabled={infinite.isFetchingNextPage}
            onClick={() => void infinite.fetchNextPage()}
          >
            <ChevronDown className="size-4" />
            {infinite.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {/* ── Create dialog ── */}
      <TxFormDialog
        id="tx-create-dialog"
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New transaction"
        description="Income increases balance; expense and investment decrease it."
        form={form}
        setForm={setForm}
        accounts={accounts}
        formCategories={formCategories}
        error={createError}
        isPending={createMutation.isPending}
        onCancel={() => setCreateOpen(false)}
        onSubmit={submitCreate}
        submitLabel="Create"
      />

      {/* ── Edit dialog ── */}
      <TxFormDialog
        id="tx-edit-dialog"
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title="Edit transaction"
        description="Update fields and save."
        form={form}
        setForm={setForm}
        accounts={accounts}
        formCategories={formCategories}
        error={updateError}
        isPending={updateMutation.isPending}
        onCancel={() => setEditTarget(null)}
        onSubmit={submitEdit}
        submitLabel="Save"
        submitDisabled={!editTarget}
      />

      {/* ── Delete confirm ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reverse the effect on your account balance.
            </AlertDialogDescription>
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
                deleteMutation.mutate({ id: deleteTarget.id, userId });
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

// ─── Shared form dialog ────────────────────────────────────────────────────────
function TxFormDialog({
  id,
  open,
  onOpenChange,
  title,
  description,
  form,
  setForm,
  accounts,
  formCategories,
  error,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
  submitDisabled = false,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: TxFormState;
  setForm: React.Dispatch<React.SetStateAction<TxFormState>>;
  accounts: Account[];
  formCategories: Category[];
  error: string | null;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id={id} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Type selector — pill buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.values(TransactionType).map((t) => {
            const cfg = typeConfig[t] ?? defaultTxConfig;
            const active = form.type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t as TransactionType, categoryId: CATEGORY_NONE }))}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-[11px] font-semibold transition-all",
                  active
                    ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                    : "border-transparent bg-muted text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <cfg.icon className={cn("size-5", active ? "text-primary" : cfg.iconColor)} strokeWidth={2} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3">
          <Field>
            <FieldLabel>Account</FieldLabel>
            <FieldContent>
              <Select
                value={form.accountId || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
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
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={CATEGORY_NONE}>None</SelectItem>
                  {formCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor={`${id}-amount`}>Amount</FieldLabel>
              <FieldContent>
                <Input
                  id={`${id}-amount`}
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
              <FieldLabel htmlFor={`${id}-date`}>Date</FieldLabel>
              <FieldContent>
                <Input
                  id={`${id}-date`}
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
                />
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor={`${id}-note`}>Note</FieldLabel>
            <FieldContent>
              <Input
                id={`${id}-note`}
                placeholder="Optional description"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </FieldContent>
          </Field>

          {error ? <FieldError>{error}</FieldError> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            type="button"
            disabled={isPending || submitDisabled || !form.accountId || !form.amount}
            onClick={onSubmit}
          >
            {isPending ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function transitions_count_label(count: number, hasMore: boolean | undefined): string {
  if (count === 0) return "No transactions";
  return `${count} transaction${count !== 1 ? "s" : ""}${hasMore ? " — scroll for more" : ""}`;
}
