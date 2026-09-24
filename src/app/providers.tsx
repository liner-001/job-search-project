"use client";

import { Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThreadProvider } from "@/contexts/ThreadContext";
import { UISettingsProvider } from "@/contexts/UISettingsContext";
import { OAuthToast } from "@/components/OAuthToast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UISettingsProvider>
        <ThreadProvider>
          <Suspense fallback={null}>
            <OAuthToast />
          </Suspense>
          {children}
        </ThreadProvider>
      </UISettingsProvider>
    </QueryClientProvider>
  );
}
