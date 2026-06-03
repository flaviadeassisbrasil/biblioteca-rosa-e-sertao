import { useState, useEffect } from 'react';
import { BookOpen, RotateCcw } from 'lucide-react';
import { getLoansByUser, renewLoan } from '../services/loans';
import { useAuthContext } from '../contexts/AuthContext';
import { Loan } from '../types';
import { MAX_RENEWALS } from '../utils/constants';

const STATUS_LABEL: Record<Loan['status'], string> = {
  pending: 'Aguardando aprovação',
  active: 'Ativo',
  returned: 'Devolvido',
  overdue: 'Em atraso',
};

const STATUS_STYLE: Record<Loan['status'], string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  active: 'bg-cerrado-light text-cerrado',
  returned: 'bg-gray-100 text-gray-500',
  overdue: 'bg-red-50 text-red-600',
};

const formatDate = (ts: { toDate: () => Date } | null | undefined): string => {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('pt-BR');
};

export const MyLoans = () => {
  const { user } = useAuthContext();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);

  const fetchLoans = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLoansByUser(user.uid);
      setLoans(data);
    } catch (e) {
      setError('Erro ao carregar empréstimos. Tente recarregar a página.');
      console.error('getLoansByUser falhou:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, [user]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRenew = async (loan: Loan) => {
    setRenewing(loan.loanId);
    try {
      await renewLoan(loan.loanId, loan.dueDate, loan.renewalsUsed);
      await fetchLoans();
      showFeedback('Empréstimo renovado! Nova data de devolução atualizada.');
    } catch (e: unknown) {
      showFeedback(e instanceof Error ? e.message : 'Erro ao renovar.');
    } finally {
      setRenewing(null);
    }
  };

  const filtered = filter === 'active'
    ? loans.filter(l => l.status === 'active' || l.status === 'pending' || l.status === 'overdue')
    : loans;

  return (
    <div className="flex flex-col gap-4">

      <h1 className="text-2xl font-bold text-cerrado">Meus Empréstimos</h1>

      {/* Erro de carregamento */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Feedback de ação */}
      {feedback && (
        <div className="bg-cerrado-light text-cerrado text-sm px-4 py-2 rounded-lg">
          {feedback}
        </div>
      )}

      {/* Filtro */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`text-sm px-3 py-1.5 rounded-lg border transition ${
            filter === 'active'
              ? 'bg-cerrado text-white border-cerrado'
              : 'border-gray-200 text-gray-600 hover:border-cerrado hover:text-cerrado'
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`text-sm px-3 py-1.5 rounded-lg border transition ${
            filter === 'all'
              ? 'bg-cerrado text-white border-cerrado'
              : 'border-gray-200 text-gray-600 hover:border-cerrado hover:text-cerrado'
          }`}
        >
          Histórico completo
        </button>
      </div>

      {/* Lista */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-cerrado border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <BookOpen size={32} />
          <p className="text-sm">
            {filter === 'active' ? 'Nenhum empréstimo ativo.' : 'Nenhum empréstimo encontrado.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(loan => {
            const canRenew = loan.status === 'active' && loan.renewalsUsed < MAX_RENEWALS;
            const isRenewing = renewing === loan.loanId;

            return (
              <div key={loan.loanId} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">

                <div className="flex-1 flex flex-col gap-1">
                  <p className="font-medium text-gray-900 text-sm">{loan.bookTitle}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    <span>Solicitado: {formatDate(loan.loanDate as never)}</span>
                    {loan.status !== 'returned' && (
                      <span className={loan.status === 'overdue' ? 'text-red-500 font-medium' : ''}>
                        Vence: {formatDate(loan.dueDate as never)}
                      </span>
                    )}
                    {loan.returnDate && <span>Devolvido: {formatDate(loan.returnDate as never)}</span>}
                    {loan.renewalsUsed > 0 && (
                      <span>Renovações: {loan.renewalsUsed}/{MAX_RENEWALS}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLE[loan.status]}`}>
                    {STATUS_LABEL[loan.status]}
                  </span>

                  {canRenew && (
                    <button
                      onClick={() => handleRenew(loan)}
                      disabled={isRenewing}
                      className="flex items-center gap-1 text-xs border border-cerrado text-cerrado px-3 py-1.5 rounded-lg hover:bg-cerrado-light transition disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      {isRenewing ? 'Renovando...' : 'Renovar'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
