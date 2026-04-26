'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';

import { cn } from '~/lib/utils';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
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
import { Progress } from '~/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { EmptyState } from '~/components/ui/empty-state';
import { FinancialDisplay } from '~/components/ui/financial-display';
import { api, type RouterOutputs } from '~/trpc/react';

type BudgetItem = RouterOutputs['budget']['getAll'][number];
type Category = RouterOutputs['category']['getAll'][number];

type BudgetListProps = {
  initialBudgets: BudgetItem[];
  initialCategories: Category[];
  userId: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toTrpcMessage = (error: { message?: string } | null): string | null => {
  if (!error?.message) return null;
  return error.message;
};

const emptyForm = { categoryId: '', amount: '' };

export const BudgetList = ({
  initialBudgets,
  initialCategories,
  userId,
}: BudgetListProps): React.ReactElement => {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const utils = api.useUtils();

  const { data: budgets = initialBudgets } = api.budget.getAll.useQuery(
    { userId, month: viewMonth, year: viewYear },
    {
      initialData:
        viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear()
          ? initialBudgets
          : undefined,
    },
  );

  const { data: categories = initialCategories } = api.category.getAll.useQuery(
    { userId },
    { initialData: initialCategories },
  );

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ amount: '' });

  const invalidate = async () => {
    await utils.budget.getAll.invalidate({ userId, month: viewMonth, year: viewYear });
  };

  const createMutation = api.budget.create.useMutation({
    onSuccess: async () => {
      await invalidate();
      setCreateOpen(false);
      setCreateForm(emptyForm);
    },
  });

  const updateMutation = api.budget.update.useMutation({
    onSuccess: async () => {
      await invalidate();
      setEditTarget(null);
    },
  });

  const deleteMutation = api.budget.delete.useMutation({
    onSuccess: async () => {
      await invalidate();
      setDeleteTarget(null);
    },
  });

  const navigateMonth = (dir: 1 | -1): void => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const submitCreate = (): void => {
    const amount = Number.parseFloat(createForm.amount);
    if (Number.isNaN(amount) || amount <= 0) return;
    if (!createForm.categoryId) return;
    createMutation.mutate({
      userId,
      categoryId: createForm.categoryId,
      amount,
      month: viewMonth,
      year: viewYear,
    });
  };

  const submitEdit = (): void => {
    if (!editTarget) return;
    const amount = Number.parseFloat(editForm.amount);
    if (Number.isNaN(amount) || amount <= 0) return;
    updateMutation.mutate({ id: editTarget.id, amount });
  };

  const createError = toTrpcMessage(createMutation.error);
  const updateError = toTrpcMessage(updateMutation.error);
  const deleteError = toTrpcMessage(deleteMutation.error);

  // Categories already used this month (to prevent duplicate budget per category)
  const usedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = expenseCategories.filter(
    (c) => !usedCategoryIds.has(c.id),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button data-global-action="add" type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add budget
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Monthly Budget</CardTitle>
            <CardDescription>
              {budgets.length} budget{budgets.length !== 1 ? 's' : ''} for{' '}
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {budgets.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No budgets set"
              description={`You have no budgets for ${MONTH_NAMES[viewMonth - 1]} ${viewYear}. Set a limit for your expenses.`}
              className="min-h-[250px] border-none"
            />
          ) : (
            <div className="space-y-6">
              {budgets.map((budget) => {
                const budgetAmount = Number(budget.amount);
                const percentage =
                  budgetAmount > 0
                    ? Math.min((budget.used / budgetAmount) * 100, 100)
                    : 0;
                const isOverBudget = budget.remaining < 0;

                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {budget.category.name}
                        </p>
                        {isOverBudget && (
                          <Badge variant="destructive" className="shrink-0">Over budget</Badge>
                        )}
                        {!isOverBudget && percentage > 80 && (
                          <Badge variant="outline" className="shrink-0">Almost full</Badge>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <FinancialDisplay amount={budget.used} showSign={false} className="text-xs font-semibold" />
                          <span className="text-xs text-muted-foreground mx-1">/</span>
                          <FinancialDisplay amount={budgetAmount} showSign={false} className="text-xs text-muted-foreground" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit budget"
                          className="opacity-50 hover:opacity-100"
                          onClick={() => {
                            setEditTarget(budget);
                            setEditForm({ amount: String(budgetAmount) });
                          }}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete budget"
                          className="opacity-50 hover:opacity-100 hover:text-destructive"
                          onClick={() => setDeleteTarget(budget)}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={percentage}
                      className={cn(
                        'h-2.5 rounded-full overflow-hidden border border-white/5',
                        isOverBudget
                          ? '[&>[data-slot=progress-indicator]]:bg-destructive'
                          : percentage > 80
                            ? '[&>[data-slot=progress-indicator]]:bg-amber-500'
                            : '[&>[data-slot=progress-indicator]]:bg-emerald-500',
                      )}
                    />
                    <div className="flex justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span>Used: <FinancialDisplay amount={budget.used} showSign={false} className="text-muted-foreground ml-1" /></span>
                      <span className={cn(isOverBudget && 'text-destructive')}>
                        {isOverBudget ? 'Over by ' : 'Remaining: '}
                        <FinancialDisplay amount={Math.abs(budget.remaining)} showSign={false} className={cn(isOverBudget && 'text-destructive')} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New budget</DialogTitle>
            <DialogDescription>
              Set a spending limit for {MONTH_NAMES[viewMonth - 1]} {viewYear}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel>Category</FieldLabel>
              <FieldContent>
                <Select
                  value={createForm.categoryId}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, categoryId: v }))
                  }
                >
                  <SelectTrigger id="budget-create-category">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        All expense categories have budgets
                      </SelectItem>
                    ) : (
                      availableCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="budget-create-amount">Amount limit</FieldLabel>
              <FieldContent>
                <Input
                  id="budget-create-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="e.g. 1000000"
                  value={createForm.amount}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, amount: e.target.value }))
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
                !createForm.categoryId ||
                !createForm.amount
              }
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
            <DialogTitle>Edit budget</DialogTitle>
            <DialogDescription>
              Update limit for &ldquo;{editTarget?.category.name}&rdquo; —{' '}
              {MONTH_NAMES[viewMonth - 1]} {viewYear}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="budget-edit-amount">Amount limit</FieldLabel>
              <FieldContent>
                <Input
                  id="budget-edit-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, amount: e.target.value }))
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
              disabled={updateMutation.isPending || !editForm.amount}
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
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will remove the budget for "${deleteTarget.category.name}" in ${MONTH_NAMES[viewMonth - 1]} ${viewYear}. This cannot be undone.`
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
                deleteMutation.mutate({ id: deleteTarget.id });
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
