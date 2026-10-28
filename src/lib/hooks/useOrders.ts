import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addresses as addressesApi, checkout as checkoutApi, orders as ordersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuthStore } from '@/stores/auth.store';

function retryUnlessClientError(failureCount: number, error: Error): boolean {
  const status = (error as ApiError)?.status ?? 0;
  if (status >= 400 && status < 500) return false;
  return failureCount < 2;
}

/** Order history — `GET /orders`, paginated. */
export function useOrders() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.token));

  return useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: ({ signal }) => ordersApi.list({ signal }),
    enabled: isAuthenticated,
    retry: retryUnlessClientError,
    staleTime: 30_000,
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? 0),
    queryFn: ({ signal }) => ordersApi.detail(Number(id), { signal }),
    enabled: Boolean(id),
    retry: retryUnlessClientError,
  });
}

export function useAddresses() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.token));

  return useQuery({
    queryKey: queryKeys.addresses.list(),
    queryFn: ({ signal }) => addressesApi.list({ signal }),
    enabled: isAuthenticated,
    retry: retryUnlessClientError,
    staleTime: 60_000,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => addressesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all }),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}

/** `POST /checkout` — the only checkout route (no GET /checkout). */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkoutApi.place,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
    },
  });
}
