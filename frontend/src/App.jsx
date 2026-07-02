import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import EmployeeDashboard from "./pages/employee/Dashboard";
import ApplyLeave from "./pages/employee/ApplyLeave";
import LeaveHistory from "./pages/employee/LeaveHistory";
import LeaveDetails from "./pages/employee/LeaveDetails";
import EmployeeProfile from "./pages/employee/Profile";

import ManagerDashboard from "./pages/manager/Dashboard";
import PendingApprovals from "./pages/manager/PendingApprovals";
import Employees from "./pages/manager/Employees";
import ManagerProfile from "./pages/manager/Profile";

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "MANAGER" ? "/manager/dashboard" : "/dashboard"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleHome />} />

      {/* Employee routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/apply" element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><ApplyLeave /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><LeaveHistory /></ProtectedRoute>} />
      <Route path="/leaves/:id" element={<ProtectedRoute><LeaveDetails /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><EmployeeProfile /></ProtectedRoute>} />

      {/* Manager routes */}
      <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={["MANAGER"]}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/pending" element={<ProtectedRoute allowedRoles={["MANAGER"]}><PendingApprovals /></ProtectedRoute>} />
      <Route path="/manager/employees" element={<ProtectedRoute allowedRoles={["MANAGER"]}><Employees /></ProtectedRoute>} />
      <Route path="/manager/profile" element={<ProtectedRoute allowedRoles={["MANAGER"]}><ManagerProfile /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
