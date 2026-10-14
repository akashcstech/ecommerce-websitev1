import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RequireCustomer from "@/components/RequireCustomer";
import { useMe } from "@/hooks/useShop";
import { apiPost, apiPut } from "@/lib/api";
import { errMsg } from "@/lib/format";
import type { User } from "@/lib/types";

function ProfileForms({ me }: { me: User }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: me.name, phone: me.phone, address: me.address });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });

  const save = useMutation({
    mutationFn: () => apiPut<User>("/auth/profile", form),
    onSuccess: (u) => {
      qc.setQueryData(["me"], u);
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const changePw = useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>("/auth/password", pw),
    onSuccess: () => {
      setPw({ current_password: "", new_password: "" });
      toast.success("Password changed");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-xl font-semibold">Personal details</h2>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={me.email} disabled data-testid="profile-email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="profile-phone-input" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Delivery address</Label>
          <Textarea id="address" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House no, street, area, city, PIN code" data-testid="profile-address-input" />
        </div>
        <Button type="submit" className="rounded-full" disabled={save.isPending} data-testid="profile-save-button">
          {save.isPending && <Loader2 className="size-4 animate-spin" />} Save changes
        </Button>
      </form>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          changePw.mutate();
        }}
        className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-xl font-semibold">Change password</h2>
        <div className="space-y-2">
          <Label htmlFor="cur">Current password</Label>
          <Input id="cur" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} data-testid="profile-current-password-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new">New password (min 6 characters)</Label>
          <Input id="new" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} data-testid="profile-new-password-input" />
        </div>
        <Button type="submit" variant="outline" className="rounded-full" disabled={changePw.isPending} data-testid="profile-change-password-button">
          Update password
        </Button>
      </form>
    </div>
  );
}

function ProfileInner() {
  const { me } = useMe();
  return me ? <ProfileForms me={me} /> : null;
}

export default function Profile() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">My profile</h1>
      <RequireCustomer>
        <ProfileInner />
      </RequireCustomer>
    </div>
  );
}
