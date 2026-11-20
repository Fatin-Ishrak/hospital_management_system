// APP SHELL  (owner: Member 1)
// Builds all routes from the modules that exist in src/modules. Contains no page code itself.
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import RequireRole from '@/core/auth/RequireRole.jsx';
import { PortalContext } from '@/core/auth/PortalContext.jsx';
import Login from '@/core/auth/pages/Login.jsx';
import Layout from '@/core/layout/Layout.jsx';
import { PageLoader } from '@/core/ui';
import NotIncluded from './NotIncluded.jsx';
import { modules, publicLinks, publicRoutes } from './moduleRegistry.js';

// "/" sends a logged-in user to the portal of their role, and everybody else to the login page
function Home() {
  const { session, role, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!session || !role) return <Navigate to="/login" replace />;
  const mod = modules.find((m) => m.role === role);
  return mod ? <Navigate to={mod.home} replace /> : <NotIncluded role={role} />;
}

// Old addresses keep working: /signup -> /register, /signup?type=doctor -> /activate
function SignupRedirect() {
  const [params] = useSearchParams();
  const wanted = params.get('type') === 'doctor' ? '/activate' : '/register';
  const target = publicRoutes.find((r) => r.path === wanted);
  return <Navigate to={target ? target.path : '/login'} replace />;
}

export default function App() {
  return (
    <PortalContext.Provider value={{ publicLinks }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login links={publicLinks} />} />
        <Route path="/signup" element={<SignupRedirect />} />
        {publicRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        {modules.map((m) => (
          <Route
            key={m.id}
            path={m.home}
            element={
              <RequireRole role={m.role} record={m.requires}>
                <Layout nav={m.nav} />
              </RequireRole>
            }
          >
            {m.routes.map((r) =>
              r.index ? <Route key="index" index element={r.element} /> : <Route key={r.path} path={r.path} element={r.element} />
            )}
          </Route>
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PortalContext.Provider>
  );
}
