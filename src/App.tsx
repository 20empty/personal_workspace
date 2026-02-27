import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import DeliveryManager from "./pages/DeliveryManager";
import ClassDetail from "./pages/ClassDetail";
import DevTracker from "./pages/DevTracker";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="delivery" element={<DeliveryManager />} />
        <Route path="delivery/:classId" element={<ClassDetail />} />
        <Route path="dev" element={<DevTracker />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
