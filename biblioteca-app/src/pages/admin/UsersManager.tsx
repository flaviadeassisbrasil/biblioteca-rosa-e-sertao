import { useState, useEffect } from 'react';
import { Users, ShieldCheck, ShieldOff, Ban, CheckCircle } from 'lucide-react';
import { getAllUsers, setUserRole, setUserBlocked } from '../../services/users';
import { useAuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';

const formatDate = (ts: { toDate: () => Date } | null | undefined): string => {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('pt-BR');
};

export const UsersManager = () => {
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'admin' | 'blocked'>('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleRole = async (u: User) => {
    if (u.uid === currentUser?.uid) {
      showFeedback('Você não pode alterar seu próprio papel.');
      return;
    }
    setActing(u.uid);
    try {
      const newRole = u.role === 'admin' ? 'user' : 'admin';
      await setUserRole(u.uid, newRole);
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, role: newRole } : x));
      showFeedback(newRole === 'admin' ? `${u.name} agora é administrador.` : `${u.name} virou usuário comum.`);
    } finally {
      setActing(null);
    }
  };

  const handleToggleBlock = async (u: User) => {
    if (u.uid === currentUser?.uid) {
      showFeedback('Você não pode bloquear a si mesmo.');
      return;
    }
    setActing(u.uid);
    try {
      const newBlocked = !u.blocked;
      await setUserBlocked(u.uid, newBlocked);
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, blocked: newBlocked } : x));
      showFeedback(newBlocked ? `${u.name} foi bloqueado.` : `${u.name} foi desbloqueado.`);
    } finally {
      setActing(null);
    }
  };

  const filtered = users.filter(u => {
    if (filter === 'admin') return u.role === 'admin';
    if (filter === 'blocked') return u.blocked;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">

      {/* Cabeçalho */}
      <h1 className="text-2xl font-bold text-cerrado">Usuários</h1>

      {/* Feedback */}
      {feedback && (
        <div className="bg-cerrado-light text-cerrado text-sm px-4 py-2 rounded-lg">
          {feedback}
        </div>
      )}

      {/* Contadores + filtros */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'admin', 'blocked'] as const).map(f => {
          const count = f === 'all' ? users.length
            : f === 'admin' ? users.filter(u => u.role === 'admin').length
            : users.filter(u => u.blocked).length;
          const label = f === 'all' ? 'Todos' : f === 'admin' ? 'Admins' : 'Bloqueados';
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                filter === f
                  ? 'bg-cerrado text-white border-cerrado'
                  : 'border-gray-200 text-gray-600 hover:border-cerrado hover:text-cerrado'
              }`}
            >
              {label}
              <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-cerrado border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <Users size={32} />
          <p className="text-sm">Nenhum usuário encontrado.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(u => {
            const isActing = acting === u.uid;
            const isSelf = u.uid === currentUser?.uid;

            return (
              <div
                key={u.uid}
                className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  u.blocked ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                }`}
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cerrado-light flex items-center justify-center flex-shrink-0">
                      <span className="text-cerrado font-semibold text-sm">
                        {u.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm truncate">{u.name}</p>
                      {isSelf && (
                        <span className="text-xs bg-cerrado-light text-cerrado px-2 py-0.5 rounded-full">
                          você
                        </span>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-xs bg-sertao-light text-sertao px-2 py-0.5 rounded-full font-medium">
                          admin
                        </span>
                      )}
                      {u.blocked && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          bloqueado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <p className="text-xs text-gray-400">
                      Entrou em {formatDate(u.createdAt as never)} · Último acesso: {formatDate(u.lastLogin as never)}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                {!isSelf && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleRole(u)}
                      disabled={isActing}
                      title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
                        u.role === 'admin'
                          ? 'border-sertao text-sertao hover:bg-sertao-light'
                          : 'border-gray-200 text-gray-500 hover:border-sertao hover:text-sertao'
                      }`}
                    >
                      {u.role === 'admin'
                        ? <><ShieldOff size={12} /> Remover admin</>
                        : <><ShieldCheck size={12} /> Tornar admin</>
                      }
                    </button>

                    <button
                      onClick={() => handleToggleBlock(u)}
                      disabled={isActing}
                      title={u.blocked ? 'Desbloquear' : 'Bloquear'}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
                        u.blocked
                          ? 'border-cerrado text-cerrado hover:bg-cerrado-light'
                          : 'border-red-200 text-red-500 hover:bg-red-50'
                      }`}
                    >
                      {u.blocked
                        ? <><CheckCircle size={12} /> Desbloquear</>
                        : <><Ban size={12} /> Bloquear</>
                      }
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
