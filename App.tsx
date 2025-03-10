import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import DataImport from "@/pages/data-import";
import MarkerAssignment from "@/pages/marker-assignment";
import StaffingChanges from "@/pages/staffing-changes";
import GanttView from "@/pages/gantt-view";
import TeacherReports from "@/pages/teacher-reports";
import TaskTracking from "@/pages/task-tracking";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/import" component={DataImport} />
        <Route path="/assignment" component={MarkerAssignment} />
        <Route path="/staffing" component={StaffingChanges} />
        <Route path="/gantt" component={GanttView} />
        <Route path="/reports" component={TeacherReports} />
        <Route path="/tracking" component={TaskTracking} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
