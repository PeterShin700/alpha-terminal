'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        router.push('/');
        return;
      }

      // Check if user is the root admin by email
      const isRootAdmin = user.email === process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL;
      
      // Check if user has admin custom claim
      const idTokenResult = await user.getIdTokenResult();
      const isCustomAdmin = !!idTokenResult.claims.admin;

      if (isRootAdmin || isCustomAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-bold text-gray-500 animate-pulse">관리자 권한 확인 중...</div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { name: '대시보드 홈', path: '/admin' },
    { name: '유저 관리', path: '/admin/users' },
    { name: '데이터 로그', path: '/admin/data-logs' },
    { name: '마켓 브리핑 등록', path: '/admin/market-briefing' },
    { name: '커뮤니티 관리', path: '/admin/community' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl flex flex-col">
        <div className="p-6 border-b">
          <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter hover:opacity-80 transition-opacity">
            ALPHA<span className="text-gray-900">TERMINAL</span>
          </Link>
          <div className="mt-2 text-sm font-bold text-gray-500">통합 관리자 대시보드</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-4 py-3 rounded-lg font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Link href="/" className="block w-full py-2 px-4 bg-gray-900 hover:bg-black text-white text-center font-bold rounded-lg transition-colors">
            터미널로 돌아가기
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
