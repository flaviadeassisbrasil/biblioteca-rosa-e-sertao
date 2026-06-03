import { Navigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

export const Login = () => {
  const { user, loginWithGoogle, loading, error } = useAuthContext();

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-cerrado-light">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-cerrado rounded-full p-4">
            <BookOpen size={36} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-cerrado">Biblioteca</h1>
          <p className="text-sm text-gray-500 text-center">
            Museu Comunitário Seu Duchim
          </p>
        </div>

        {/* Divisor */}
        <div className="w-full border-t border-gray-100" />

        {/* Mensagem de erro */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg w-full text-center">
            {error}
          </p>
        )}

        {/* Botão Google */}
        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Acesso restrito aos membros do Instituto Rosa e Sertão
        </p>
      </div>
    </div>
  );
};
