'use client';
import { useState, useEffect } from 'react';
import { Briefing } from '@/types/briefing';
import { getBriefings, incrementReaction } from '@/lib/briefing-api';

export default function MarketBriefing() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, 'likes' | 'dislikes'>>({});

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

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
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
        </div>
      ))}
    </div>
  );
}
