import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = async (): Promise<void> => {
  await signInWithPopup(auth, provider);
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const syncUserWithFirestore = async (firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    await updateDoc(userRef, { lastLogin: Timestamp.now() });
    return { ...userSnap.data(), lastLogin: Timestamp.now() } as User;
  }

  const newUser: User = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    name: firebaseUser.displayName ?? '',
    photoURL: firebaseUser.photoURL ?? undefined,
    role: 'user',
    createdAt: Timestamp.now(),
    lastLogin: Timestamp.now(),
    blocked: false,
  };

  await setDoc(userRef, newUser);
  return newUser;
};
