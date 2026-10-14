import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/useShop";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import { errMsg } from "@/lib/format";
import type { Category } from "@/lib/types";

export default function AdminCategories() {
  const qc = useQueryClient();
  const { data, isError } = useCategories();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const create = useMutation({
    mutationFn: () => apiPost<Category>("/admin/categories", { name }),
    onSuccess: (c) => {
      setName("");
      toast.success(`Category “${c.name}” created`);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const rename = useMutation({
    mutationFn: (v: { id: string; name: string }) => apiPut<Category>(`/admin/categories/${v.id}`, { name: v.name }),
    onSuccess: () => {
      setEditId(null);
      toast.success("Category renamed");
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const cats = isError ? [] : (data ?? []);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Categories</h1>
        <p className="text-slate-500">Group products so customers can filter the catalogue.</p>
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" required minLength={2} data-testid="admin-category-name-input" />
        <Button type="submit" className="rounded-full" disabled={create.isPending} data-testid="admin-add-category-button">
          <Plus className="size-4" /> Add
        </Button>
      </form>

      <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-3" data-testid={`admin-category-row-${c.id}`}>
            {editId === c.id ? (
              <>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" autoFocus data-testid="admin-category-edit-input" />
                <Button size="icon-sm" onClick={() => rename.mutate({ id: c.id, name: editName })} aria-label="Save" data-testid="admin-category-save-button">
                  <Check className="size-4" />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setEditId(null)} aria-label="Cancel">
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="font-medium">{c.name}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{c.product_count} products</span>
                <div className="ml-auto flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Rename"
                    onClick={() => {
                      setEditId(c.id);
                      setEditName(c.name);
                    }}
                    data-testid={`admin-edit-category-${c.id}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    aria-label="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete category “${c.name}”?`)) remove.mutate(c.id);
                    }}
                    data-testid={`admin-delete-category-${c.id}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
