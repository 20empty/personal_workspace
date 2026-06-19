import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { UpdateProvider } from "./components/layout/UpdateProvider";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DeliveryManager = lazy(() => import("./pages/DeliveryManager"));
const ClassDetail = lazy(() => import("./pages/ClassDetail"));
const DevTracker = lazy(() => import("./pages/DevTracker"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

function PageFallback() {
  return (
    <div className="grid min-h-[320px] place-items-center text-sm text-[color:var(--muted)]">
      正在加载页面...
    </div>
  );
}

function routePage(element: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export default function App() {
  return (
    <UpdateProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={routePage(<Dashboard />)} />
          <Route path="dashboard" element={routePage(<Dashboard />)} />
          <Route path="delivery" element={routePage(<DeliveryManager />)} />
          <Route path="delivery/:classId" element={routePage(<ClassDetail />)} />
          <Route path="dev" element={routePage(<DevTracker />)} />
          <Route path="profile" element={routePage(<Profile />)} />
          <Route path="settings" element={routePage(<Settings />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </UpdateProvider>
  );
}
