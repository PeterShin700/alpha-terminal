'use client';
import { useState, useEffect } from 'react';
import { Briefing } from '@/types/briefing';
import { getBriefings, incrementReaction, addBriefingComment } from '@/lib/briefing-api';
import { useAuth } from '@/contexts/AuthContext';


export default function MarketBriefing() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, 'likes' | 'dislikes'>>({});
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const isRootAdmin = user.email === process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL;
      const token = await user.getIdTokenResult();
      setIsAdmin(isRootAdmin || !!token.claims.admin);
    }
    checkAdmin();
  }, [user]);

  useEffect(() => {
    async function fetchLatest() {
      const data = await getBriefings(10); // 최근 10개 표시
      setBriefings(data);
      
      // 로컬 스토리지에서 리액션 상태 확인
      const reactions: Record<string, 'likes' | 'dislikes'> = {};
      data.forEach(item => {
        if (item.id) {
          const stored = localStorage.getItem(`briefing_reaction_${item.id}`);
          if (stored === 'likes' || stored === 'dislikes') {
            reactions[item.id] = stored;
          }
        }
      });
      setUserReactions(reactions);
      setIsLoading(false);
    }
    fetchLatest();
  }, []);

  const submitAdminComment = async (briefingId: string | undefined) => {
    if (!briefingId || !user) return;
    const content = commentInputs[briefingId]?.trim();
    if (!content) return;

    setSubmittingComment(briefingId);
    const success = await addBriefingComment(briefingId, content, user.displayName || '관리자');
    
    if (success) {
      setCommentInputs(prev => ({ ...prev, [briefingId]: '' }));
      // Reload briefings to show new comment
      const data = await getBriefings(10);
      setBriefings(data);
    } else {
      alert('댓글 등록에 실패했습니다.');
    }
    setSubmittingComment(null);
  };

  const handleReaction = async (id: string | undefined, type: 'likes' | 'dislikes') => {
    if (!id || userReactions[id]) return;

    // 낙관적 업데이트
    setUserReactions(prev => ({ ...prev, [id]: type }));
    setBriefings(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, [type]: b[type] + 1 };
      }
      return b;
    }));

    // 로컬 스토리지 저장
    localStorage.setItem(`briefing_reaction_${id}`, type);

    // DB 업데이트
    await incrementReaction(id, type);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-gray-500 text-center">
        오늘의 마켓 브리핑이 아직 등록되지 않았습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {briefings.map(briefing => (
        <div key={briefing.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-800">마켓 브리핑</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {new Date(briefing.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
          
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
            {briefing.content}
          </p>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mb-4">
            <button
              onClick={() => handleReaction(briefing.id, 'likes')}
              disabled={!!(briefing.id && userReactions[briefing.id])}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                briefing.id && userReactions[briefing.id] === 'likes' 
                  ? 'bg-blue-100 text-blue-700 font-bold border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 disabled:opacity-50'
              }`}
            >
              <span className="text-lg">👍</span>
              <span>{briefing.likes}</span>
            </button>
            <button
              onClick={() => handleReaction(briefing.id, 'dislikes')}
              disabled={!!(briefing.id && userReactions[briefing.id])}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                briefing.id && userReactions[briefing.id] === 'dislikes' 
                  ? 'bg-red-100 text-red-700 font-bold border border-red-200' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 disabled:opacity-50'
              }`}
            >
              <span className="text-lg">👎</span>
              <span>{briefing.dislikes}</span>
            </button>
          </div>

          {/* Admin Comments Section */}
          {(briefing.adminComments && briefing.adminComments.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-700 border-b pb-2 mb-2">관리자 코멘트</h4>
              {briefing.adminComments.map(comment => (
                <div key={comment.id} className="text-sm text-gray-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-700">{comment.authorName}</span>
                    <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <p className="whitespace-pre-wrap pl-1">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Admin Comment Input */}
          {isAdmin && briefing.id && (
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                placeholder="최고 관리자 전용 코멘트 입력..."
                value={commentInputs[briefing.id] || ''}
                onChange={e => setCommentInputs(prev => ({ ...prev, [briefing.id as string]: e.target.value }))}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') submitAdminComment(briefing.id);
                }}
              />
              <button
                onClick={() => submitAdminComment(briefing.id)}
                disabled={submittingComment === briefing.id || !(commentInputs[briefing.id]?.trim())}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingComment === briefing.id ? '등록중...' : '등록'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
