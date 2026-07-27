"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/auth-store";
import { wishlistApi } from "./wishlist-api";

export function useWishlist() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ queryKey: qk.wishlist, queryFn: () => wishlistApi.list(), enabled: isAuth });
}
export function useWishlistMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.wishlist });
  return {
    add: useMutation({ mutationFn: (id: string) => wishlistApi.add(id),
      onSuccess: () => { invalidate(); toast.success("Saved to wishlist"); }, onError: (e: Error) => toast.error(e.message) }),
    remove: useMutation({ mutationFn: (id: string) => wishlistApi.remove(id),
      onSuccess: () => { invalidate(); toast.success("Removed from wishlist"); }, onError: (e: Error) => toast.error(e.message) }),
  };
}
