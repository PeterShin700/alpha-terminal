'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import AuthModal from './AuthModal';

export default function ClientAuthStatus() {
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <span className="text-gray-400 text-sm">로딩 중...</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {user.displayName || user.email?.split('@')[0]}님
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
      >
        로그인
      </button>
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
