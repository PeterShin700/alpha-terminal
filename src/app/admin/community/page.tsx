'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminCommunityPage() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleGenerateMockData = async () => {
    if (!confirm('자유게시판에 가상의 테스트용 게시글과 댓글을 생성하시겠습니까?')) return;
    setIsGenerating(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/community', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('가상 데이터가 성공적으로 생성되었습니다. 커뮤니티 페이지에서 확인해보세요.');
      } else {
        const error = await res.json();
        alert(`생성 실패: ${error.error}`);
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('정말 삭제하시겠습니까? 커뮤니티의 모든 게시글과 댓글이 완전히 삭제되며 복구할 수 없습니다!')) return;
    setIsDeleting(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/community', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('모든 게시글 및 댓글이 삭제되었습니다.');
      } else {
        const error = await res.json();
        alert(`삭제 실패: ${error.error}`);
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">커뮤니티 관리</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">테스트용 가상 데이터 생성</h2>
          <p className="text-gray-600 mb-4">
            자유게시판이 너무 비어보이지 않도록 가상의 파생상품/주식 관련 게시글과 댓글을 일괄 생성합니다. 
            처음 서비스를 오픈할 때 유용하게 사용할 수 있습니다.
          </p>
          <button
            onClick={handleGenerateMockData}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isGenerating ? '생성 중...' : '가상 게시글/댓글 생성하기'}
          </button>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">커뮤니티 초기화 (Danger Zone)</h2>
          <p className="text-gray-600 mb-4">
            자유게시판에 등록된 <span className="font-bold text-red-500">모든 게시글과 댓글</span>을 데이터베이스에서 영구적으로 삭제합니다.
            가상 데이터를 테스트한 후 실제 유저들을 받기 전에 게시판을 깨끗하게 비울 때 사용하세요.
          </p>
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition"
          >
            {isDeleting ? '삭제 중...' : '모든 게시글 및 댓글 삭제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
