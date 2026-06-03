import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { BooksManager } from './pages/admin/BooksManager';
import { LoansManager } from './pages/admin/LoansManager';
import { UsersManager } from './pages/admin/UsersManager';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MyLoans } from './pages/MyLoans';

const ComingSoon = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center py-20">
    <p className="text-gray-400 text-lg">{label} — em breve</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas com layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Home /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/catalogo" element={
            <ProtectedRoute>
              <Layout><Catalog /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/meus-emprestimos" element={
            <ProtectedRoute>
              <Layout><MyLoans /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/livros" element={
            <ProtectedRoute adminOnly>
              <Layout><BooksManager /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/emprestimos" element={
            <ProtectedRoute adminOnly>
              <Layout><LoansManager /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute adminOnly>
              <Layout><UsersManager /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute adminOnly>
              <Layout><ComingSoon label="Admin" /></Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
