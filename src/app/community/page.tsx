'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPosts, addPost } from '@/lib/community-api';
import type { Post } from '@/types/community';

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const data = await getPosts();
    setPosts(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!user || !newContent.trim()) return;
    setIsSubmitting(true);
    const id = await addPost({
      authorId: user.uid,
      authorName: user.displayName || '익명',
      content: newContent.trim()
    });
    setIsSubmitting(false);
    if (id) {
      setNewContent('');
      setIsWriting(false);
      fetchPosts(); // 새로고침
    } else {
      alert('게시글 등록에 실패했습니다.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="flex justify-between items-center border-b pb-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">자유게시판</h1>
        <button 
          onClick={() => {
            if (!user) {
              alert('로그인이 필요한 기능입니다. 상단 우측의 로그인 버튼을 눌러주세요.');
              return;
            }
            setIsWriting(!isWriting);
          }}
          className="bg-gray-900 text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition"
        >
          {isWriting ? '취소' : '글쓰기'}
        </button>
      </div>

      {isWriting && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="자유롭게 의견을 남겨주세요... (건전한 커뮤니티 문화를 지향합니다)"
            className="w-full h-32 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!newContent.trim() || isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          첫 번째 게시글을 남겨보세요!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <Link key={post.id} href={`/community/${post.id}`}>
              <div className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{post.authorName}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 line-clamp-3 mb-4">
                  {post.content}
                </p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">👍 {post.likes}</span>
                  <span className="flex items-center gap-1">👎 {post.dislikes}</span>
                  <span className="flex items-center gap-1">💬 {post.commentCount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
