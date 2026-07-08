'use client';
import { useState, useEffect } from 'react';
import { Briefing } from '@/types/briefing';
import { getBriefings, addBriefing, updateBriefing, deleteBriefing } from '@/lib/briefing-api';

export default function AdminBriefingManager() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBriefings();
  }, []);

  const loadBriefings = async () => {
    setIsLoading(true);
    const data = await getBriefings(20);
    setBriefings(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    if (editingId) {
      await updateBriefing(editingId, content);
    } else {
      await addBriefing(content);
    }
    setContent('');
    setEditingId(null);
    await loadBriefings();
  };

  const handleEdit = (briefing: Briefing) => {
    setContent(briefing.content);
    setEditingId(briefing.id || null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 브리핑을 삭제하시겠습니까?')) return;
    
    setIsLoading(true);
    await deleteBriefing(id);
    await loadBriefings();
  };

  const cancelEdit = () => {
    setContent('');
    setEditingId(null);
  };

  return (
    <div className="space-y-6 text-black">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4">{editingId ? '마켓 브리핑 수정' : '새 마켓 브리핑 작성'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-32 p-3 border rounded focus:outline-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
            placeholder="오늘의 마켓 브리핑 예상 시황을 작성해주세요..."
            disabled={isLoading}
            required
          />
          <div className="flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                disabled={isLoading}
              >
                취소
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? '저장 중...' : (editingId ? '수정 완료' : '브리핑 등록')}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">최근 작성된 브리핑</h3>
        {briefings.length === 0 ? (
          <div className="p-4 text-center text-gray-500 bg-gray-50 rounded border">
            작성된 브리핑이 없습니다.
          </div>
        ) : (
          briefings.map(briefing => (
            <div key={briefing.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="text-sm text-gray-500">
                  {new Date(briefing.createdAt).toLocaleString('ko-KR')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    👍 {briefing.likes}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-600 rounded">
                    👎 {briefing.dislikes}
                  </span>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-gray-800">{briefing.content}</p>
              <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                <button
                  onClick={() => handleEdit(briefing)}
                  className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  수정
                </button>
                <button
                  onClick={() => briefing.id && handleDelete(briefing.id)}
                  className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
