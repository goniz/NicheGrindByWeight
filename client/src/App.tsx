import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";

// Get base path from environment or default to '/'
const basePath = import.meta.env.BASE_URL || '/';
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

function AppRouter() {
  return (
    <Router base={basePath}>
      <Switch>
        <Route path="/" component={Home} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
