"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";

import { AssetType } from "../../../../../generated/prisma";
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
import { api, type RouterOutputs } from "~/trpc/react";

type Asset = RouterOutputs["asset"]["getAll"][number];

type AssetCatalogTableProps = {
  initialAssets: Asset[];
};

const typeLabels: Record<AssetType, string> = {
  [AssetType.crypto]: "Crypto",
  [AssetType.gold]: "Gold",
  [AssetType.stock]: "Stock",
  [AssetType.other]: "Other",
};

const assetTypeOptions = Object.values(AssetType);

const toTrpcMessage = (error: { message?: string } | null): string | null => {
  if (!error?.message) return null;
  return error.message;
};

const emptyForm = {
  name: "",
  symbol: "",
  type: AssetType.stock as AssetType,
};

export const AssetCatalogTable = ({
  initialAssets,
}: AssetCatalogTableProps): React.ReactElement => {
  const utils = api.useUtils();

  const { data: assets = initialAssets } = api.asset.getAll.useQuery(
    undefined,
    { initialData: initialAssets },
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [priceTarget, setPriceTarget] = useState<Asset | null>(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [priceForm, setPriceForm] = useState({ price: "", priceDate: "" });

  const createMutation = api.asset.create.useMutation({
    onSuccess: async () => {
      await utils.asset.getAll.invalidate();
      setCreateOpen(false);
      setCreateForm(emptyForm);
    },
  });

  const updateMutation = api.asset.update.useMutation({
    onSuccess: async () => {
      await utils.asset.getAll.invalidate();
      setEditTarget(null);
    },
  });

  const deleteMutation = api.asset.delete.useMutation({
    onSuccess: async () => {
      await utils.asset.getAll.invalidate();
      setDeleteTarget(null);
    },
  });

  const updatePriceMutation = api.asset.updatePrice.useMutation({
    onSuccess: async () => {
      await utils.asset.getAll.invalidate();
      setPriceTarget(null);
      setPriceForm({ price: "", priceDate: "" });
    },
  });

  const openEdit = (asset: Asset): void => {
    setEditTarget(asset);
    setEditForm({
      name: asset.name,
      symbol: asset.symbol ?? "",
      type: asset.type,
    });
  };

  const openPrice = (asset: Asset): void => {
    setPriceTarget(asset);
    const today = new Date().toISOString().slice(0, 10);
    setPriceForm({ price: "", priceDate: today });
  };

  const createError = toTrpcMessage(createMutation.error);
  const updateError = toTrpcMessage(updateMutation.error);
  const deleteError = toTrpcMessage(deleteMutation.error);
  const priceError = toTrpcMessage(updatePriceMutation.error);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Assets</CardTitle>
          <CardDescription>
            Global catalog used across portfolios ({assets.length} items)
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Add asset
        </Button>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No assets in the catalog yet.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.symbol ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[asset.type] ?? asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Update price"
                          onClick={() => openPrice(asset)}
                        >
                          <TrendingUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit asset"
                          onClick={() => openEdit(asset)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete asset"
                          onClick={() => setDeleteTarget(asset)}
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </div>
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
            <DialogTitle>New asset</DialogTitle>
            <DialogDescription>
              Add an instrument to the shared catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="asset-create-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="asset-create-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Bitcoin"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="asset-create-symbol">Symbol</FieldLabel>
              <FieldContent>
                <Input
                  id="asset-create-symbol"
                  value={createForm.symbol}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, symbol: e.target.value }))
                  }
                  placeholder="Optional"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={createForm.type}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, type: v as AssetType }))
                  }
                >
                  <SelectTrigger id="asset-create-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypeOptions.map((t) => (
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
                  name: createForm.name.trim(),
                  symbol: createForm.symbol.trim() || undefined,
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
            <DialogTitle>Edit asset</DialogTitle>
            <DialogDescription>Update catalog entry.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="asset-edit-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="asset-edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="asset-edit-symbol">Symbol</FieldLabel>
              <FieldContent>
                <Input
                  id="asset-edit-symbol"
                  value={editForm.symbol}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, symbol: e.target.value }))
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
                    setEditForm((f) => ({ ...f, type: v as AssetType }))
                  }
                >
                  <SelectTrigger id="asset-edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypeOptions.map((t) => (
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
                  name: editForm.name.trim(),
                  symbol: editForm.symbol.trim() || undefined,
                  type: editForm.type,
                });
              }}
            >
              {updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!priceTarget}
        onOpenChange={(open) => {
          if (!open) setPriceTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update price</DialogTitle>
            <DialogDescription>
              {priceTarget
                ? `Record a price point for ${priceTarget.name}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="asset-price-value">Price</FieldLabel>
              <FieldContent>
                <Input
                  id="asset-price-value"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={priceForm.price}
                  onChange={(e) =>
                    setPriceForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="asset-price-date">Date</FieldLabel>
              <FieldContent>
                <Input
                  id="asset-price-date"
                  type="date"
                  value={priceForm.priceDate}
                  onChange={(e) =>
                    setPriceForm((f) => ({ ...f, priceDate: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>
            {priceError ? <FieldError>{priceError}</FieldError> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPriceTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                updatePriceMutation.isPending ||
                !priceTarget ||
                !priceForm.priceDate
              }
              onClick={() => {
                if (!priceTarget) return;
                const price = Number.parseFloat(priceForm.price);
                if (Number.isNaN(price) || price <= 0) return;
                const d = new Date(`${priceForm.priceDate}T12:00:00`);
                updatePriceMutation.mutate({
                  assetId: priceTarget.id,
                  price,
                  priceDate: d,
                });
              }}
            >
              {updatePriceMutation.isPending ? "Saving…" : "Save price"}
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
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove “${deleteTarget.name}” from the catalog?`
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
