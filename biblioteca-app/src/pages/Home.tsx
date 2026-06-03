import { BookOpen, BookMarked, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const Home = () => {
  const { user, isAdmin } = useAuthContext();

  return (
    <div className="flex flex-col gap-6">

      {/* Boas-vindas */}
      <div className="bg-cerrado rounded-2xl p-6 text-white">
        <p className="text-cerrado-light text-sm mb-1">Bem-vinda,</p>
        <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-cerrado-light text-sm mt-2">
          Biblioteca e Museu Comunitário Seu Duchim
        </p>
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <Link to="/catalogo" className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md hover:border-cerrado transition group">
          <div className="bg-cerrado-light rounded-lg p-3">
            <BookOpen size={24} className="text-cerrado" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Catálogo</h2>
            <p className="text-sm text-gray-500">Explore o acervo completo</p>
          </div>
          <ArrowRight size={18} className="text-gray-300 group-hover:text-cerrado transition" />
        </Link>

        <Link to="/meus-emprestimos" className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md hover:border-sertao transition group">
          <div className="bg-sertao-light rounded-lg p-3">
            <BookMarked size={24} className="text-sertao" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Meus Empréstimos</h2>
            <p className="text-sm text-gray-500">Veja seus livros ativos</p>
          </div>
          <ArrowRight size={18} className="text-gray-300 group-hover:text-sertao transition" />
        </Link>

      </div>

      {/* Painel admin */}
      {isAdmin && (
        <div className="bg-sertao-light border border-sertao rounded-xl p-5">
          <p className="text-sm font-semibold text-sertao mb-3">Painel Administrativo</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/livros" className="text-sm bg-sertao text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition">
              Gerenciar Livros
            </Link>
            <Link to="/admin/emprestimos" className="text-sm bg-sertao text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition">
              Gerenciar Empréstimos
            </Link>
            <Link to="/admin/usuarios" className="text-sm bg-sertao text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition">
              Usuários
            </Link>
          </div>
        </div>
      )}

    </div>
  );
};
