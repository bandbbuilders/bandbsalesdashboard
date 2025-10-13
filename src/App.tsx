import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginForm } from "./components/auth/LoginForm";
import { AuthGuard } from "./components/auth/AuthGuard";
import { AppLayout } from "./components/layout/AppLayout";
import { CrmLayout } from "./components/layout/CrmLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewSale from "./pages/NewSale";
import EditSale from "./pages/EditSale";
import SalesList from "./pages/SalesList";
import SaleDetails from "./pages/SaleDetails";
import PaymentLedger from "./pages/PaymentLedger";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import CrmDashboard from "./pages/crm/CrmDashboard";
import LeadsList from "./pages/crm/LeadsList";
import NewLead from "./pages/crm/NewLead";
import LeadDetails from "./pages/crm/LeadDetails";
import EditLead from "./pages/crm/EditLead";
import RemindersPage from "./pages/crm/RemindersPage";
import TaskManager from "./pages/TaskManager";
import Accounting from "./pages/Accounting";
import ScriptWriter from "./pages/ScriptWriter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/sales/*" element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="new" element={<NewSale />} />
            <Route path="list" element={<SalesList />} />
            <Route path=":id" element={<SaleDetails />} />
            <Route path=":id/edit" element={<EditSale />} />
            <Route path=":saleId/ledger" element={<PaymentLedger />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="/crm/*" element={
            <AuthGuard>
              <CrmLayout />
            </AuthGuard>
          }>
            <Route index element={<CrmDashboard />} />
            <Route path="leads" element={<LeadsList />} />
            <Route path="leads/new" element={<NewLead />} />
            <Route path="leads/:id" element={<LeadDetails />} />
            <Route path="leads/:id/edit" element={<EditLead />} />
            <Route path="reminders" element={<RemindersPage />} />
          </Route>
          <Route path="/tasks" element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route index element={<TaskManager />} />
          </Route>
          <Route path="/accounting" element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route index element={<Accounting />} />
          </Route>
          <Route path="/scripts" element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route index element={<ScriptWriter />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
