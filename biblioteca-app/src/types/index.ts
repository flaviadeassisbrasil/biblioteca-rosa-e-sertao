import { Timestamp } from 'firebase/firestore';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  status: 'available' | 'unavailable';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastLogin: Timestamp;
  blocked: boolean;
}

export interface Loan {
  loanId: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  userName: string;
  loanDate: Timestamp;
  dueDate: Timestamp;
  returnDate?: Timestamp;
  status: 'pending' | 'active' | 'returned' | 'overdue';
  renewalsUsed: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
