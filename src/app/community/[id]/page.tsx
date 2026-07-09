'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPost, getComments, addComment, updatePost, deletePost, 
  deleteComment, updateComment, incrementPostReaction, incrementCommentReaction 
} from '@/lib/community-api';
import type { Post, Comment } from '@/types/community';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const postId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Post Edit state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');

  // Comment Write state
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null); // parentId
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Comment Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function fetchData() {
    setLoading(true);
    const [p, c] = await Promise.all([getPost(postId), getComments(postId)]);
    setPost(p);
    setComments(c);
    if (p) setEditPostContent(p.content);
    setLoading(false);
  }

  // --- Post Actions ---
  const handleEditPost = async () => {
    if (!editPostContent.trim()) return;
    const ok = await updatePost(postId, editPostContent.trim());
    if (ok) {
      setPost(prev => prev ? { ...prev, content: editPostContent.trim() } : null);
      setIsEditingPost(false);
    } else {
      alert('게시글 수정 실패');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('정말 게시글을 삭제하시겠습니까? 관련 댓글도 접근할 수 없게 됩니다.')) return;
    const ok = await deletePost(postId);
    if (ok) router.push('/community');
    else alert('삭제 실패');
  };

  const handlePostReaction = async (type: 'likes' | 'dislikes') => {
    const key = `post_reaction_${postId}`;
    if (localStorage.getItem(key)) return alert('이미 평가하셨습니다.');
    const ok = await incrementPostReaction(postId, type);
    if (ok) {
      localStorage.setItem(key, type);
      setPost(prev => prev ? { ...prev, [type]: prev[type] + 1 } : null);
    }
  };

  // --- Comment Actions ---
  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmittingComment(true);
    const newId = await addComment({
      postId,
      parentId: replyTo,
      authorId: user.uid,
      authorName: user.displayName || '익명',
      content: newComment.trim()
    });
    setIsSubmittingComment(false);
    if (newId) {
      setNewComment('');
      setReplyTo(null);
      fetchData(); // Reload comments
    } else {
      alert('댓글 등록 실패');
    }
  };

  const handleEditComment = async (cId: string) => {
    if (!editCommentContent.trim()) return;
    const ok = await updateComment(cId, editCommentContent.trim());
    if (ok) {
      setEditingCommentId(null);
      setComments(prev => prev.map(c => c.id === cId ? { ...c, content: editCommentContent.trim() } : c));
    }
  };

  const handleDeleteComment = async (cId: string) => {
    if (!confirm('정말 댓글을 삭제하시겠습니까?')) return;
    const ok = await deleteComment(cId, postId);
    if (ok) fetchData();
  };

  const handleCommentReaction = async (cId: string, type: 'likes' | 'dislikes') => {
    const key = `comment_reaction_${cId}`;
    if (localStorage.getItem(key)) return alert('이미 평가하셨습니다.');
    const ok = await incrementCommentReaction(cId, type);
    if (ok) {
      localStorage.setItem(key, type);
      setComments(prev => prev.map(c => c.id === cId ? { ...c, [type]: c[type] + 1 } : c));
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto py-12 px-4 text-center">로딩 중...</div>;
  if (!post) return <div className="max-w-4xl mx-auto py-12 px-4 text-center">게시글을 찾을 수 없습니다.</div>;

  const isAuthor = user?.uid === post.authorId;

  // Separate root comments and replies for 2-depth rendering
  const rootComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      {/* Post Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{post.authorName}</h1>
            <div className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleString('ko-KR')}
            </div>
          </div>
          {isAuthor && (
            <div className="flex gap-2 text-sm">
              <button onClick={() => setIsEditingPost(!isEditingPost)} className="text-blue-600 hover:underline">
                {isEditingPost ? '취소' : '수정'}
              </button>
              <button onClick={handleDeletePost} className="text-red-600 hover:underline">삭제</button>
            </div>
          )}
        </div>

        {isEditingPost ? (
          <div className="space-y-4">
            <textarea
              value={editPostContent}
              onChange={e => setEditPostContent(e.target.value)}
              className="w-full h-32 p-3 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleEditPost} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">저장</button>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-gray-800 text-lg leading-relaxed mb-8">
            {post.content}
          </p>
        )}

        {/* Post Reactions */}
        <div className="flex justify-center gap-4 py-4">
          <button onClick={() => handlePostReaction('likes')} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-full hover:bg-gray-100">
            <span>👍</span> <span className="font-bold">{post.likes}</span>
          </button>
          <button onClick={() => handlePostReaction('dislikes')} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-full hover:bg-gray-100">
            <span>👎</span> <span className="font-bold">{post.dislikes}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold border-b pb-2">댓글 ({post.commentCount})</h3>

        {/* Comment List */}
        <div className="space-y-6">
          {rootComments.map(rc => (
            <div key={rc.id} className="space-y-4">
              {/* Root Comment */}
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{rc.authorName}</span>
                    <span className="text-xs text-gray-400">{new Date(rc.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                  
                  {editingCommentId === rc.id ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editCommentContent} 
                        onChange={e => setEditCommentContent(e.target.value)}
                        className="flex-1 border p-1 rounded text-sm"
                      />
                      <button onClick={() => rc.id && handleEditComment(rc.id)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">저장</button>
                      <button onClick={() => setEditingCommentId(null)} className="bg-gray-300 px-2 py-1 rounded text-sm">취소</button>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{rc.content}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <button onClick={() => rc.id && handleCommentReaction(rc.id, 'likes')} className="hover:text-blue-600">👍 {rc.likes}</button>
                    <button onClick={() => rc.id && handleCommentReaction(rc.id, 'dislikes')} className="hover:text-red-600">👎 {rc.dislikes}</button>
                    <button onClick={() => setReplyTo(replyTo === rc.id ? null : (rc.id || null))} className="hover:text-gray-900 font-bold">
                      {replyTo === rc.id ? '답글 취소' : '답글 달기'}
                    </button>
                    {user?.uid === rc.authorId && (
                      <>
                        <button onClick={() => { setEditingCommentId(rc.id || null); setEditCommentContent(rc.content); }} className="hover:text-gray-900">수정</button>
                        <button onClick={() => rc.id && handleDeleteComment(rc.id)} className="hover:text-red-600">삭제</button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply Input */}
              {replyTo === rc.id && (
                <div className="ml-8 flex gap-2">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="대댓글을 작성해보세요..."
                    className="flex-1 border p-2 rounded text-sm focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleSubmitComment}
                    disabled={!user || isSubmittingComment}
                    className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50"
                  >
                    등록
                  </button>
                </div>
              )}

              {/* Replies */}
              <div className="space-y-4 ml-8 border-l-2 border-gray-100 pl-4">
                {replies.filter(rep => rep.parentId === rc.id).map(rep => (
                  <div key={rep.id} className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{rep.authorName}</span>
                        <span className="text-xs text-gray-400">{new Date(rep.createdAt).toLocaleString('ko-KR')}</span>
                      </div>
                      
                      {editingCommentId === rep.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editCommentContent} 
                            onChange={e => setEditCommentContent(e.target.value)}
                            className="flex-1 border p-1 rounded text-sm"
                          />
                          <button onClick={() => rep.id && handleEditComment(rep.id)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">저장</button>
                          <button onClick={() => setEditingCommentId(null)} className="bg-gray-300 px-2 py-1 rounded text-sm">취소</button>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{rep.content}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button onClick={() => rep.id && handleCommentReaction(rep.id, 'likes')} className="hover:text-blue-600">👍 {rep.likes}</button>
                        <button onClick={() => rep.id && handleCommentReaction(rep.id, 'dislikes')} className="hover:text-red-600">👎 {rep.dislikes}</button>
                        {user?.uid === rep.authorId && (
                          <>
                            <button onClick={() => { setEditingCommentId(rep.id || null); setEditCommentContent(rep.content); }} className="hover:text-gray-900">수정</button>
                            <button onClick={() => rep.id && handleDeleteComment(rep.id)} className="hover:text-red-600">삭제</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* New Root Comment Input */}
        {!replyTo && (
          <div className="mt-8 flex gap-2">
            <textarea 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={user ? "댓글을 작성해주세요..." : "로그인 후 댓글을 남길 수 있습니다."}
              disabled={!user}
              className="flex-1 border p-3 rounded text-sm h-20 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <button 
              onClick={handleSubmitComment}
              disabled={!user || isSubmittingComment || !newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold disabled:opacity-50"
            >
              댓글 등록
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
