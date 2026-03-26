"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { CategoryType } from "../../../../../generated/prisma";
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
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api, type RouterOutputs } from "~/trpc/react";

type Category = RouterOutputs["category"]["getAll"][number];

type CategoriesManagerProps = {
  initialCategories: Category[];
  userId: string;
};

const typeLabels: Record<CategoryType, string> = {
  [CategoryType.income]: "Income",
  [CategoryType.expense]: "Expense",
  [CategoryType.investment]: "Investment",
};

const categoryTypeOptions = Object.values(CategoryType);

const toTrpcMessage = (error: { message?: string } | null): string | null => {
  if (!error?.message) return null;
  return error.message;
};

const emptyForm = {
  name: "",
  type: CategoryType.expense as CategoryType,
};

export const CategoriesManager = ({
  initialCategories,
  userId,
}: CategoriesManagerProps): React.ReactElement => {
  const utils = api.useUtils();

  const { data: categories = initialCategories } = api.category.getAll.useQuery(
    { userId },
    { initialData: initialCategories },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const createMutation = api.category.create.useMutation({
    onSuccess: async () => {
      await utils.category.getAll.invalidate({ userId });
      setCreateOpen(false);
      setCreateForm(emptyForm);
    },
  });

  const updateMutation = api.category.update.useMutation({
    onSuccess: async () => {
      await utils.category.getAll.invalidate({ userId });
      setEditTarget(null);
    },
  });

  const deleteMutation = api.category.delete.useMutation({
    onSuccess: async () => {
      await utils.category.getAll.invalidate({ userId });
      setDeleteTarget(null);
    },
  });

  const groupedCategories = categories.reduce<Record<string, Category[]>>(
    (acc, cat) => {
      const key = cat.type;
      acc[key] ??= [];
      acc[key].push(cat);
      return acc;
    },
    {},
  );

  const openEdit = (cat: Category): void => {
    setEditTarget(cat);
    setEditForm({
      name: cat.name,
      type: cat.type,
    });
  };

  const createError = toTrpcMessage(createMutation.error);
  const updateError = toTrpcMessage(updateMutation.error);
  const deleteError = toTrpcMessage(deleteMutation.error);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {categories.length} categories configured
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Add category
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No categories yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedCategories).map(([type, cats], idx, arr) => (
              <div key={type}>
                <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                  {typeLabels[type as CategoryType] ?? type}
                </p>
                <ul className="space-y-2">
                  {cats.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm font-medium">{cat.name}</span>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit category"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete category"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {idx < arr.length - 1 ? <Separator className="mt-3" /> : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Add a category for transactions and budgets.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="cat-create-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="cat-create-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Groceries"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={createForm.type}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, type: v as CategoryType }))
                  }
                >
                  <SelectTrigger id="cat-create-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              onClick={() => {
                createMutation.mutate({
                  userId,
                  name: createForm.name.trim(),
                  type: createForm.type,
                });
              }}
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
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Update name or type.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="cat-edit-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="cat-edit-name"
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
                    setEditForm((f) => ({ ...f, type: v as CategoryType }))
                  }
                >
                  <SelectTrigger id="cat-edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                updateMutation.isPending || !editForm.name.trim() || !editTarget
              }
              onClick={() => {
                if (!editTarget) return;
                updateMutation.mutate({
                  id: editTarget.id,
                  userId,
                  name: editForm.name.trim(),
                  type: editForm.type,
                });
              }}
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
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove “${deleteTarget.name}”? Linked data may be affected.`
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
