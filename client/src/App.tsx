import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Reviews from "./pages/Reviews";
import Browse from "./pages/Browse";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  if (authenticated === null) {
    return <div className="page-loading">Loading…</div>;
  }
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/" className="brand">
            Canto
          </NavLink>
          <nav className="main-nav">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/lessons">Lessons</NavLink>
            <NavLink to="/reviews">Reviews</NavLink>
            <NavLink to="/browse">Browse</NavLink>
          </nav>
          <button className="link-button" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lessons" element={<Lessons />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/browse" element={<Browse />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
