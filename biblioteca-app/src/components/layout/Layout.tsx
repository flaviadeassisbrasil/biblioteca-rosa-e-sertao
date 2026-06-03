import { ReactNode } from 'react';
import { Header } from './Header';

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main className="max-w-5xl mx-auto px-4 py-6">
      {children}
    </main>
  </div>
);
