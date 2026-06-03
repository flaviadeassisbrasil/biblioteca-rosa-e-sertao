import {
  collection, getDocs, updateDoc,
  doc, query, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

const usersCol = collection(db, 'users');

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(usersCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as User);
};

export const setUserRole = async (uid: string, role: 'admin' | 'user'): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: Timestamp.now(),
  });
};

export const setUserBlocked = async (uid: string, blocked: boolean): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    blocked,
    updatedAt: Timestamp.now(),
  });
};
