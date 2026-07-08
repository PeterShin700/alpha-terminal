'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HeaderNav() {
  const pathname = usePathname();

  const navItems = [
    { name: '마켓 브리핑', path: '/briefing' },
    { name: '파생분석 센터', path: '/derivatives' },
    { name: '글로벌 매크로', path: '/macro' },
    { name: '대형 현물 수급', path: '/liquidity' },
    { name: '자유게시판', path: '/community' },
  ];

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
