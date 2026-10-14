import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet, apiPatch } from "@/lib/api";
import { errMsg, fmtDate } from "@/lib/format";
import type { User } from "@/lib/types";

export default function AdminCustomers() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin", "customers"], queryFn: () => apiGet<User[]>("/admin/customers") });
  const toggle = useMutation({
    mutationFn: (u: User) => apiPatch<User>(`/admin/customers/${u.id}/active`, { is_active: !u.is_active }),
    onSuccess: (u) => {
      toast.success(`${u.name} ${u.is_active ? "activated" : "deactivated"}`);
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const users = list.isError ? [] : (list.data ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Customers</h1>
        <p className="text-slate-500">Deactivated customers can't log in or place orders.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} data-testid={`admin-customer-row-${u.id}`}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-slate-600">{u.email}</TableCell>
                <TableCell className="text-slate-600">{u.phone}</TableCell>
                <TableCell className="text-sm text-slate-600">{fmtDate(u.created_at)}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${u.is_active ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
                    data-testid={`admin-customer-status-${u.id}`}
                  >
                    {u.is_active ? "Active" : "Deactivated"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={u.is_active ? "outline" : "default"}
                    className="rounded-full"
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate(u)}
                    data-testid={`admin-customer-toggle-${u.id}`}
                  >
                    {u.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">No customers yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
