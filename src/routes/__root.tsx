import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFoundPage from "@/pages/Error/404";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,
  component: () => (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <Outlet />
          </AuthProvider>
        </ThemeProvider>
        <TanStackRouterDevtools />
      </QueryClientProvider>
    </>
  ),
});
