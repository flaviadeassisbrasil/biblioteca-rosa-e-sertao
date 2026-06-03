import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search } from 'lucide-react';
import { useBooks } from '../../hooks/useBooks';
import { createBook, updateBook, deleteBook } from '../../services/books';
import { CATEGORIES } from '../../utils/constants';
import { Book } from '../../types';

// ── Formulário ────────────────────────────────────────────────────────────────
interface BookFormProps {
  initial?: Partial<Book>;
  onSave: (data: Omit<Book, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const BookForm = ({ initial, onSave, onCancel, saving }: BookFormProps) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [totalQuantity, setTotalQuantity] = useState(initial?.totalQuantity ?? 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      author: author.trim(),
      category,
      totalQuantity,
      availableQuantity: initial?.availableQuantity ?? totalQuantity,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Título *</label>
        <input
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cerrado"
          placeholder="Título do livro"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Autor</label>
        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cerrado"
          placeholder="Nome do autor"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Categoria *</label>
        <select
          required
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cerrado"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Exemplares</label>
        <input
          type="number"
          min={1}
          value={totalQuantity}
          onChange={e => setTotalQuantity(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cerrado w-24"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <X size={14} /> Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1 px-4 py-2 text-sm bg-cerrado text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          <Check size={14} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Página principal ──────────────────────────────────────────────────────────
export const BooksManager = () => {
  const { loading, error, fetchBooks, filterBooks } = useBooks();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = filterBooks(search, category);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAdd = async (data: Omit<Book, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true);
    try {
      await createBook(data);
      await fetchBooks();
      setModal(null);
      showFeedback('Livro adicionado com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: Omit<Book, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateBook(selected.id, data);
      await fetchBooks();
      setModal(null);
      showFeedback('Livro atualizado com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteBook(selected.id);
      await fetchBooks();
      setModal(null);
      showFeedback('Livro removido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cerrado">Gerenciar Livros</h1>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-cerrado text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
        >
          <Plus size={16} /> Novo livro
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="bg-cerrado-light text-cerrado text-sm px-4 py-2 rounded-lg">
          {feedback}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou autor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cerrado"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cerrado"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-cerrado border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && (
        <>
          <p className="text-sm text-gray-500">{filtered.length} livro(s)</p>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden sm:table-cell">Autor</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Categoria</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Qtd</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                      <span className="line-clamp-2">{book.title}</span>
                      {!book.author && (
                        <span className="text-xs text-amber-500">revisar autor</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{book.author || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs bg-sertao-light text-sertao px-2 py-0.5 rounded-full">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        book.availableQuantity > 0
                          ? 'bg-cerrado-light text-cerrado'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {book.availableQuantity}/{book.totalQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setSelected(book); setModal('edit'); }}
                          className="p-1.5 text-gray-400 hover:text-cerrado hover:bg-cerrado-light rounded-lg transition"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setSelected(book); setModal('delete'); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Deletar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Adicionar */}
      {modal === 'add' && (
        <Modal title="Novo livro" onClose={() => setModal(null)}>
          <BookForm onSave={handleAdd} onCancel={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* Modal Editar */}
      {modal === 'edit' && selected && (
        <Modal title="Editar livro" onClose={() => setModal(null)}>
          <BookForm initial={selected} onSave={handleEdit} onCancel={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* Modal Deletar */}
      {modal === 'delete' && selected && (
        <Modal title="Remover livro" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-600 mb-6">
            Tem certeza que quer remover <strong>"{selected.title}"</strong>? Essa ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Removendo...' : 'Remover'}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};
