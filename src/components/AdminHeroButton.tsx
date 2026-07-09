'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function AdminHeroButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const isRootAdmin = user.email === process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL;
      
      try {
        const idTokenResult = await user.getIdTokenResult();
        const isCustomAdmin = !!idTokenResult.claims.admin;
        setIsAdmin(isRootAdmin || isCustomAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading || !isAdmin) return null;

  return (
    <div className="mt-4 animate-fade-in-up">
      <Link 
        href="/admin" 
        className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-900 to-black text-white px-8 py-3 rounded-md font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
      >
        <span>👑</span> 관리자 전용 대시보드 입장
      </Link>
    </div>
  );
}
