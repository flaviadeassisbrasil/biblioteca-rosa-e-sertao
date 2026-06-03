import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Book } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';
import { requestLoan } from '../../services/loans';

interface BookCardProps {
  book: Book;
}

export const BookCard = ({ book }: BookCardProps) => {
  const { user } = useAuthContext();
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const available = book.status === 'available';

  const handleRequest = async () => {
    if (!user) return;
    setRequesting(true);
    setFeedback(null);
    try {
      await requestLoan(user.uid, user.name, book.id, book.title);
      setFeedback({ msg: 'Solicitação enviada! Aguarde aprovação.', ok: true });
    } catch (e: unknown) {
      setFeedback({ msg: e instanceof Error ? e.message : 'Erro ao solicitar.', ok: false });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">

      {/* Capa placeholder */}
      <div className="bg-cerrado-light rounded-md flex items-center justify-center h-32">
        <BookOpen size={40} className="text-cerrado opacity-40" />
      </div>

      {/* Informações */}
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1">{book.author || '—'}</p>
        <span className="text-xs text-sertao bg-sertao-light px-2 py-0.5 rounded-full w-fit">
          {book.category}
        </span>
      </div>

      {/* Disponibilidade + ação */}
      <div className="flex flex-col gap-2 mt-1">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
          available
            ? 'bg-cerrado-light text-cerrado'
            : 'bg-red-50 text-red-600'
        }`}>
          {available ? `Disponível (${book.availableQuantity})` : 'Indisponível'}
        </span>

        {available && (
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="w-full text-xs bg-cerrado text-white py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {requesting ? 'Solicitando...' : 'Solicitar Empréstimo'}
          </button>
        )}

        {feedback && (
          <p className={`text-xs text-center ${feedback.ok ? 'text-cerrado' : 'text-red-500'}`}>
            {feedback.msg}
          </p>
        )}
      </div>
    </div>
  );
};
