import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { errMsg } from "@/lib/format";
import type { Cart, Category, User } from "@/lib/types";

// "Who am I" — errors (401) simply mean logged out.
export function useMe() {
  const q = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<User>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
  return { me: q.isError ? null : (q.data ?? null), isLoading: q.isLoading };
}

export function useCart() {
  const { me } = useMe();
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiGet<Cart>("/cart"),
    enabled: !!me && !me.is_admin,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/categories") });
}

export function useAddToCart() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { me } = useMe();
  const mutation = useMutation({
    mutationFn: (v: { productId: string; quantity: number }) =>
      apiPost<Cart>("/cart/items", { product_id: v.productId, quantity: v.quantity }),
    onSuccess: (cart) => {
      qc.setQueryData(["cart"], cart);
      toast.success("Added to cart", {
        action: { label: "Checkout", onClick: () => navigate("/checkout") },
      });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const add = (productId: string, quantity = 1, then?: () => void) => {
    if (!me) {
      toast.info("Please log in to add items to your cart");
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (me.is_admin) {
      toast.error("Admin accounts can't shop. Log in as a customer.");
      return;
    }
    mutation.mutate({ productId, quantity }, { onSuccess: () => then?.() });
  };

  return { add, isPending: mutation.isPending, pendingId: mutation.variables?.productId };
}
