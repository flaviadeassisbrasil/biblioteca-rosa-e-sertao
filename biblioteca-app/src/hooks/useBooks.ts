import { useState, useEffect } from 'react';
import { getAllBooks } from '../services/books';
import { Book } from '../types';

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await getAllBooks();
      setBooks(data);
    } catch {
      setError('Erro ao carregar livros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Busca e filtro client-side
  const filterBooks = (search: string, category: string) => {
    return books.filter(book => {
      const matchSearch =
        search === '' ||
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === '' || book.category === category;
      return matchSearch && matchCategory;
    });
  };

  return { books, loading, error, fetchBooks, filterBooks };
};
