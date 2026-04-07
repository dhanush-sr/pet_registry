import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useLocation } from "wouter";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { LandingPage } from "@/pages/landing";
import { RegisterPage } from "@/pages/register";
import { VerifyPage } from "@/pages/verify";
import { PetProfilePage } from "@/pages/pet-profile";
import { VetDashboardPage } from "@/pages/vet-dashboard";
import { VetLoginPage } from "@/pages/vet-login";
import { AdminDashboardPage } from "@/pages/admin-dashboard";
import { MyPetsPage } from "@/pages/my-pets";
import { VetAuthProvider, useVetAuth } from "@/hooks/use-vet-auth";

const queryClient = new QueryClient();

function ProtectedVetRoute() {
  const { isAuthenticated } = useVetAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/vet/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <VetDashboardPage />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/verify" component={VerifyPage} />
        <Route path="/my-pets" component={MyPetsPage} />
        <Route path="/pet/:id" component={PetProfilePage} />
        <Route path="/vet/login" component={VetLoginPage} />
        <Route path="/vet" component={ProtectedVetRoute} />
        <Route path="/admin" component={AdminDashboardPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VetAuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </VetAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
