import {
  collection, addDoc, updateDoc, getDocs,
  doc, query, where, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Loan } from '../types';
import { LOAN_DURATION_DAYS, MAX_RENEWALS, MAX_ACTIVE_LOANS } from '../utils/constants';

const loansCol = collection(db, 'loans');

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ── Validações ────────────────────────────────────────────────────────────────
export const validateLoanRequest = async (userId: string): Promise<string | null> => {
  const q = query(loansCol, where('userId', '==', userId), where('status', 'in', ['pending', 'active', 'overdue']));
  const snap = await getDocs(q);
  const loans = snap.docs.map(d => d.data() as Loan);

  const overdue = loans.some(l => l.status === 'overdue');
  if (overdue) return 'Você tem um empréstimo em atraso. Devolva antes de solicitar novos.';

  const active = loans.filter(l => l.status === 'active' || l.status === 'pending').length;
  if (active >= MAX_ACTIVE_LOANS) return `Limite de ${MAX_ACTIVE_LOANS} empréstimos simultâneos atingido.`;

  return null;
};

// ── Solicitar empréstimo ──────────────────────────────────────────────────────
export const requestLoan = async (
  userId: string,
  userName: string,
  bookId: string,
  bookTitle: string
): Promise<void> => {
  const error = await validateLoanRequest(userId);
  if (error) throw new Error(error);

  const now = new Date();
  await addDoc(loansCol, {
    userId,
    userName,
    bookId,
    bookTitle,
    loanDate: Timestamp.fromDate(now),
    dueDate: Timestamp.fromDate(addDays(now, LOAN_DURATION_DAYS)),
    returnDate: null,
    status: 'pending',
    renewalsUsed: 0,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
};

// ── Aprovar empréstimo (admin) ────────────────────────────────────────────────
export const approveLoan = async (loanId: string, bookId: string): Promise<void> => {
  const { updateBook } = await import('./books');
  const { getDoc } = await import('firebase/firestore');

  const bookRef = doc(db, 'books', bookId);
  const bookSnap = await getDoc(bookRef);
  if (!bookSnap.exists()) throw new Error('Livro não encontrado.');

  const current = bookSnap.data().availableQuantity as number;
  if (current <= 0) throw new Error('Livro sem exemplares disponíveis.');

  await updateDoc(doc(db, 'loans', loanId), {
    status: 'active',
    updatedAt: Timestamp.now(),
  });

  await updateBook(bookId, { availableQuantity: current - 1 });
};

// ── Rejeitar empréstimo (admin) ───────────────────────────────────────────────
export const rejectLoan = async (loanId: string): Promise<void> => {
  await updateDoc(doc(db, 'loans', loanId), {
    status: 'returned',
    updatedAt: Timestamp.now(),
  });
};

// ── Registrar devolução (admin) ───────────────────────────────────────────────
export const returnLoan = async (loanId: string, bookId: string): Promise<void> => {
  const { updateBook } = await import('./books');
  const { getDoc } = await import('firebase/firestore');

  await updateDoc(doc(db, 'loans', loanId), {
    status: 'returned',
    returnDate: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const bookRef = doc(db, 'books', bookId);
  const bookSnap = await getDoc(bookRef);
  if (bookSnap.exists()) {
    const data = bookSnap.data();
    const current = data.availableQuantity as number;
    const total = data.totalQuantity as number;
    await updateBook(bookId, { availableQuantity: Math.min(total, current + 1) });
  }
};

// ── Renovar empréstimo ────────────────────────────────────────────────────────
export const renewLoan = async (loanId: string, currentDueDate: Timestamp, renewalsUsed: number): Promise<void> => {
  if (renewalsUsed >= MAX_RENEWALS) throw new Error(`Limite de ${MAX_RENEWALS} renovações atingido.`);

  const newDueDate = addDays(currentDueDate.toDate(), LOAN_DURATION_DAYS);
  await updateDoc(doc(db, 'loans', loanId), {
    dueDate: Timestamp.fromDate(newDueDate),
    renewalsUsed: renewalsUsed + 1,
    updatedAt: Timestamp.now(),
  });
};

// ── Marcar vencidos como overdue ──────────────────────────────────────────────
// Chamada client-side ao carregar empréstimos (sem Cloud Functions, custo zero)
export const syncOverdueLoans = async (loans: Loan[]): Promise<Loan[]> => {
  const now = Timestamp.now();
  const toMark = loans.filter(
    l => l.status === 'active' && l.dueDate.toMillis() < now.toMillis()
  );

  if (toMark.length > 0) {
    await Promise.all(
      toMark.map(l =>
        updateDoc(doc(db, 'loans', l.loanId), {
          status: 'overdue',
          updatedAt: Timestamp.now(),
        })
      )
    );
    return loans.map(l =>
      toMark.some(o => o.loanId === l.loanId) ? { ...l, status: 'overdue' as const } : l
    );
  }

  return loans;
};

// ── Queries ───────────────────────────────────────────────────────────────────
export const getLoansByUser = async (userId: string): Promise<Loan[]> => {
  // Sem orderBy aqui para evitar necessidade de índice composto no Firestore.
  // A ordenação é feita client-side logo abaixo.
  const q = query(loansCol, where('userId', '==', userId));
  const snap = await getDocs(q);
  const loans = snap.docs
    .map(d => ({ loanId: d.id, ...d.data() } as Loan))
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  return syncOverdueLoans(loans);
};

export const getAllLoans = async (): Promise<Loan[]> => {
  const q = query(loansCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const loans = snap.docs.map(d => ({ loanId: d.id, ...d.data() } as Loan));
  return syncOverdueLoans(loans);
};

export const getPendingLoans = async (): Promise<Loan[]> => {
  const q = query(loansCol, where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ loanId: d.id, ...d.data() } as Loan));
};
