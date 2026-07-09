'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function HeaderNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
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
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: '마켓 브리핑', path: '/briefing' },
    { name: '파생분석 센터', path: '/derivatives' },
    { name: '글로벌 매크로', path: '/macro' },
    { name: '대형 현물 수급', path: '/liquidity' },
    { name: '자유게시판', path: '/community' },
  ];

  if (isAdmin) {
    navItems.push({ name: '관리자', path: '/admin' });
  }

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </>
  );
}
