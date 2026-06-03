import { useState } from 'react';
import { Search } from 'lucide-react';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/books/BookCard';
import { CATEGORIES } from '../utils/constants';

export const Catalog = () => {
  const { loading, error, filterBooks } = useBooks();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const filtered = filterBooks(search, category);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-cerrado mb-6">Catálogo</h1>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cerrado text-gray-700"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Estados */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-cerrado border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-center text-red-600 py-10">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          {search || category ? 'Nenhum livro encontrado.' : 'Nenhum livro cadastrado ainda.'}
        </p>
      )}

      {/* Grid de livros */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">{filtered.length} livro(s) encontrado(s)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
