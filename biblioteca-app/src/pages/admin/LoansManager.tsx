import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, BookOpen } from 'lucide-react';
import { getAllLoans, approveLoan, rejectLoan, returnLoan } from '../../services/loans';
import { Loan } from '../../types';

const STATUS_LABEL: Record<Loan['status'], string> = {
  pending: 'Pendente',
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

export const LoansManager = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Loan['status'] | 'all'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await getAllLoans();
      setLoans(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApprove = async (loan: Loan) => {
    setActing(loan.loanId);
    try {
      await approveLoan(loan.loanId, loan.bookId);
      await fetchLoans();
      showFeedback('Empréstimo aprovado!');
    } catch (e: unknown) {
      showFeedback(e instanceof Error ? e.message : 'Erro ao aprovar.');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (loan: Loan) => {
    setActing(loan.loanId);
    try {
      await rejectLoan(loan.loanId);
      await fetchLoans();
      showFeedback('Solicitação rejeitada.');
    } finally {
      setActing(null);
    }
  };

  const handleReturn = async (loan: Loan) => {
    setActing(loan.loanId);
    try {
      await returnLoan(loan.loanId, loan.bookId);
      await fetchLoans();
      showFeedback('Devolução registrada!');
    } finally {
      setActing(null);
    }
  };

  const filtered = filter === 'all' ? loans : loans.filter(l => l.status === filter);

  return (
    <div className="flex flex-col gap-4">

      {/* Cabeçalho */}
      <h1 className="text-2xl font-bold text-cerrado">Gerenciar Empréstimos</h1>

      {/* Feedback */}
      {feedback && (
        <div className="bg-cerrado-light text-cerrado text-sm px-4 py-2 rounded-lg">
          {feedback}
        </div>
      )}

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'active', 'overdue', 'returned'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              filter === s
                ? 'bg-cerrado text-white border-cerrado'
                : 'border-gray-200 text-gray-600 hover:border-cerrado hover:text-cerrado'
            }`}
          >
            {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
            <span className="ml-1 text-xs opacity-70">
              ({s === 'all' ? loans.length : loans.filter(l => l.status === s).length})
            </span>
          </button>
        ))}
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
          <p className="text-sm">Nenhum empréstimo encontrado.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(loan => {
            const isActing = acting === loan.loanId;
            return (
              <div key={loan.loanId} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">

                {/* Info */}
                <div className="flex-1 flex flex-col gap-1">
                  <p className="font-medium text-gray-900 text-sm line-clamp-1">{loan.bookTitle}</p>
                  <p className="text-xs text-gray-500">{loan.userName}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                    <span>Solicitado: {formatDate(loan.loanDate as never)}</span>
                    <span>Vence: {formatDate(loan.dueDate as never)}</span>
                    {loan.returnDate && <span>Devolvido: {formatDate(loan.returnDate as never)}</span>}
                    {loan.renewalsUsed > 0 && <span>Renovações: {loan.renewalsUsed}</span>}
                  </div>
                </div>

                {/* Status + ações */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLE[loan.status]}`}>
                    {STATUS_LABEL[loan.status]}
                  </span>

                  {loan.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(loan)}
                        disabled={isActing}
                        className="flex items-center gap-1 text-xs bg-cerrado text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                      >
                        <Check size={12} /> Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(loan)}
                        disabled={isActing}
                        className="flex items-center gap-1 text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        <X size={12} /> Rejeitar
                      </button>
                    </>
                  )}

                  {(loan.status === 'active' || loan.status === 'overdue') && (
                    <button
                      onClick={() => handleReturn(loan)}
                      disabled={isActing}
                      className="flex items-center gap-1 text-xs bg-sertao text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      <RotateCcw size={12} /> Devolver
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
