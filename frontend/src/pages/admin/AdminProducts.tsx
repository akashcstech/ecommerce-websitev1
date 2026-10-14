import { useState, type ChangeEvent, type FormEvent } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { StockBadge } from "@/components/Badges";
import { useCategories } from "@/hooks/useShop";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { errMsg, inr } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import type { Product, ProductInput, ProductPage } from "@/lib/types";

const EMPTY = { category_id: "", name: "", description: "", price: "", stock: "", image_url: "" };
type FormState = typeof EMPTY;

export default function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const { data: categories } = useCategories();

  const list = useQuery({
    queryKey: ["products", { admin: true, q }],
    queryFn: () => apiGet<ProductPage>(`/products?${new URLSearchParams({ q, sort: "name", page_size: "200" })}`),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const save = useMutation({
    mutationFn: (body: ProductInput) =>
      editing ? apiPut<Product>(`/admin/products/${editing.id}`, body) : apiPost<Product>("/admin/products", body),
    onSuccess: (p) => {
      toast.success(editing ? `Updated “${p.name}”` : `Added “${p.name}”`);
      setOpen(false);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, category_id: categories?.[0]?.id ?? "" });
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      category_id: p.category_id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      image_url: p.image_url,
    });
    setOpen(true);
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Image must be under 1 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image_url: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.category_id) return toast.error("Choose a category");
    save.mutate({
      category_id: form.category_id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Math.floor(Number(form.stock)),
      image_url: form.image_url.trim(),
    });
  };

  const catName = (id: string) => categories?.find((c) => c.id === id)?.name ?? "Select category";
  const items = list.isError ? [] : (list.data?.items ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="text-slate-500">{list.data?.total ?? 0} products in the catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-56 rounded-full pl-9" data-testid="admin-product-search-input" />
          </div>
          <Button className="rounded-full" onClick={openNew} data-testid="admin-add-product-button">
            <Plus className="size-4" /> Add product
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id} data-testid={`admin-product-row-${p.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={getAssetImageUrl(p.image_url)} alt="" className="size-10 rounded-lg object-cover" />
                    <span className="max-w-64 truncate font-medium">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{p.category_name}</TableCell>
                <TableCell className="text-right tabular-nums">{inr(p.price)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="tabular-nums" data-testid={`admin-product-stock-${p.id}`}>{p.stock}</span>
                    <StockBadge stock={p.stock} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label="Edit" data-testid={`admin-edit-product-${p.id}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-600 hover:bg-red-50"
                      aria-label="Delete"
                      data-testid={`admin-delete-product-${p.id}`}
                      onClick={() => {
                        if (window.confirm(`Delete “${p.name}”?`)) remove.mutate(p.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-500">No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="product-form-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pname">Name</Label>
              <Input id="pname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="product-form-name-input" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v: string) => setForm({ ...form, category_id: v })}>
                <SelectTrigger className="w-full" data-testid="product-form-category-select">
                  <SelectValue placeholder="Select a category">{catName(form.category_id)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pprice">Price (₹)</Label>
                <Input id="pprice" type="number" min="1" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="product-form-price-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pstock">Stock</Label>
                <Input id="pstock" type="number" min="0" step="1" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} data-testid="product-form-stock-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pimg">Image URL or upload</Label>
              <div className="flex gap-2">
                <Input
                  id="pimg"
                  required
                  placeholder="https://…"
                  value={form.image_url.startsWith("data:") ? "(uploaded image)" : form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  data-testid="product-form-image-input"
                />
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors hover:bg-slate-50" data-testid="product-form-upload-button">
                  <Upload className="size-4" /> Upload
                  <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
                </label>
              </div>
              {form.image_url && <img src={getAssetImageUrl(form.image_url)} alt="Preview" className="h-28 w-28 rounded-xl border object-cover" data-testid="product-form-image-preview" />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea id="pdesc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="product-form-description-input" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="product-form-cancel-button">Cancel</Button>
              <Button type="submit" disabled={save.isPending} data-testid="product-form-save-button">
                {save.isPending && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Save changes" : "Add product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
