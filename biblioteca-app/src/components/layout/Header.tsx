import { BookOpen, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

export const Header = () => {
  const { user, logout, isAdmin } = useAuthContext();
  const location = useLocation();

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
          active
            ? 'bg-cerrado-light text-cerrado'
            : 'text-gray-600 hover:text-cerrado hover:bg-cerrado-light'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-cerrado rounded-lg p-1.5">
            <BookOpen size={18} color="white" />
          </div>
          <span className="font-bold text-cerrado text-sm hidden sm:block">
            Biblioteca Seu Duchim
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLink('/catalogo', 'Catálogo')}
          {navLink('/meus-emprestimos', 'Meus Empréstimos')}
          {isAdmin && navLink('/admin', 'Admin')}
        </nav>

        {/* Usuário */}
        <div className="flex items-center gap-2">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              referrerPolicy="no-referrer"
              onError={e => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.removeAttribute('style');
              }}
              className="w-8 h-8 rounded-full border-2 border-cerrado-light"
            />
          ) : null}
          <div
            style={user?.photoURL ? { display: 'none' } : undefined}
            className="w-8 h-8 rounded-full bg-cerrado-light flex items-center justify-center"
          >
            {user?.name ? (
              <span className="text-cerrado font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={16} className="text-cerrado" />
            )}
          </div>
          {isAdmin && (
            <span className="text-xs bg-sertao text-white px-2 py-0.5 rounded-full hidden sm:block">
              Admin
            </span>
          )}
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </header>
  );
};
