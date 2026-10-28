import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { useAuthStore } from './stores/auth.store';
import { retryUnlessClientError } from './lib/hooks/useCatalog';
import './styles/global.css';

/**
 * One QueryClient for the app.
 *
 * The backend sends `Cache-Control: private` and there is no service worker,
 * so React Query is the only cache (API.md gotcha #11) — `staleTime` on each
 * hook decides how fresh catalog data is, and 4xx is never retried.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryUnlessClientError,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
    mutations: { retry: false },
  },
});

/** Restore a persisted session once, before the first paint settles. */
function useSessionBootstrap() {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
}

function Root() {
  useSessionBootstrap();
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </StrictMode>,
);
