import { Link } from 'react-router-dom';
import { BookOpen, BookMarked, Users, ArrowRight } from 'lucide-react';

const cards = [
  {
    to: '/admin/livros',
    icon: BookOpen,
    title: 'Gerenciar Livros',
    description: 'Cadastrar, editar e remover livros do acervo',
    color: 'cerrado',
  },
  {
    to: '/admin/emprestimos',
    icon: BookMarked,
    title: 'Gerenciar Empréstimos',
    description: 'Aprovar solicitações, registrar devoluções e ver atrasos',
    color: 'sertao',
  },
  {
    to: '/admin/usuarios',
    icon: Users,
    title: 'Usuários',
    description: 'Gerenciar papéis e bloqueios de usuários',
    color: 'cerrado',
  },
];

export const AdminDashboard = () => (
  <div className="flex flex-col gap-6">

    <div>
      <h1 className="text-2xl font-bold text-cerrado">Painel Administrativo</h1>
      <p className="text-sm text-gray-500 mt-1">Biblioteca e Museu Comunitário Seu Duchim</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(({ to, icon: Icon, title, description, color }) => (
        <Link
          key={to}
          to={to}
          className={`bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4
            hover:shadow-md hover:border-${color} transition group`}
        >
          <div className={`bg-${color}-light rounded-lg p-3 flex-shrink-0`}>
            <Icon size={22} className={`text-${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
          </div>
          <ArrowRight
            size={16}
            className={`text-gray-300 group-hover:text-${color} transition flex-shrink-0 mt-0.5`}
          />
        </Link>
      ))}
    </div>

  </div>
);
