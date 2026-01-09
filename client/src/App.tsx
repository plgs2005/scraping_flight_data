import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RulesList from "./pages/RulesList";
import RuleForm from "./pages/RuleForm";
import DealsHistory from "./pages/DealsHistory";
import JobLogs from "./pages/JobLogs";
import Alerts from "./pages/Alerts";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/rules"} component={RulesList} />
      <Route path={"/rules/new"} component={RuleForm} />
      <Route path={"/rules/:id/edit"} component={RuleForm} />
      <Route path={"/deals"} component={DealsHistory} />
      <Route path={"/logs"} component={JobLogs} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
