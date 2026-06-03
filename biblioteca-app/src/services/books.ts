import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Book } from '../types';

const booksCol = collection(db, 'books');

export const getAllBooks = async (): Promise<Book[]> => {
  const snap = await getDocs(query(booksCol, orderBy('title')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
};

export const getBooksByCategory = async (category: string): Promise<Book[]> => {
  const q = query(booksCol, where('category', '==', category), orderBy('title'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
};

export const createBook = async (
  book: Omit<Book, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<Book> => {
  const now = Timestamp.now();
  const data = {
    ...book,
    status: book.availableQuantity > 0 ? 'available' : 'unavailable',
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(booksCol, data);
  return { id: ref.id, ...data } as Book;
};

export const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
  const ref = doc(db, 'books', id);
  const data: Partial<Book> & { updatedAt: Timestamp } = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  if (updates.availableQuantity !== undefined) {
    data.status = updates.availableQuantity > 0 ? 'available' : 'unavailable';
  }
  await updateDoc(ref, data);
};

export const deleteBook = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'books', id));
};
