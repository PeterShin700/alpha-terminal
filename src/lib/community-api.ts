import { db } from './firebase';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, 
  query, orderBy, increment, getDoc 
} from 'firebase/firestore';
import type { Post, Comment } from '@/types/community';

const POSTS_COL = 'community_posts';
const COMMENTS_COL = 'community_comments';

// --- Posts ---
export async function getPosts(): Promise<Post[]> {
  try {
    const q = query(collection(db, POSTS_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
  } catch (e) {
    console.error('Error fetching posts:', e);
    return [];
  }
}

export async function getPost(id: string): Promise<Post | null> {
  try {
    const d = await getDoc(doc(db, POSTS_COL, id));
    if (d.exists()) return { id: d.id, ...d.data() } as Post;
    return null;
  } catch (e) {
    console.error('Error fetching post:', e);
    return null;
  }
}

export async function addPost(post: Omit<Post, 'id' | 'likes' | 'dislikes' | 'commentCount' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, POSTS_COL), {
      ...post,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0,
      commentCount: 0
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding post:', e);
    return null;
  }
}

export async function updatePost(id: string, content: string) {
  try {
    await updateDoc(doc(db, POSTS_COL, id), { content });
    return true;
  } catch (e) {
    console.error('Error updating post:', e);
    return false;
  }
}

export async function deletePost(id: string) {
  try {
    await deleteDoc(doc(db, POSTS_COL, id));
    return true;
  } catch (e) {
    console.error('Error deleting post:', e);
    return false;
  }
}

export async function incrementPostReaction(id: string, type: 'likes' | 'dislikes') {
  try {
    await updateDoc(doc(db, POSTS_COL, id), { [type]: increment(1) });
    return true;
  } catch (e) {
    console.error('Error reacting to post:', e);
    return false;
  }
}

// --- Comments ---
export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const q = query(collection(db, COMMENTS_COL), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    // Client-side filter for now to avoid complex index requirements on simple projects
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Comment))
      .filter(c => c.postId === postId);
  } catch (e) {
    console.error('Error fetching comments:', e);
    return [];
  }
}

export async function addComment(comment: Omit<Comment, 'id' | 'likes' | 'dislikes' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, COMMENTS_COL), {
      ...comment,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0
    });
    // Increment post comment count
    await updateDoc(doc(db, POSTS_COL, comment.postId), { commentCount: increment(1) });
    return docRef.id;
  } catch (e) {
    console.error('Error adding comment:', e);
    return null;
  }
}

export async function deleteComment(commentId: string, postId: string) {
  try {
    await deleteDoc(doc(db, COMMENTS_COL, commentId));
    // Decrement post comment count
    await updateDoc(doc(db, POSTS_COL, postId), { commentCount: increment(-1) });
    return true;
  } catch (e) {
    console.error('Error deleting comment:', e);
    return false;
  }
}

export async function updateComment(id: string, content: string) {
  try {
    await updateDoc(doc(db, COMMENTS_COL, id), { content });
    return true;
  } catch (e) {
    console.error('Error updating comment:', e);
    return false;
  }
}

export async function incrementCommentReaction(id: string, type: 'likes' | 'dislikes') {
  try {
    await updateDoc(doc(db, COMMENTS_COL, id), { [type]: increment(1) });
    return true;
  } catch (e) {
    console.error('Error reacting to comment:', e);
    return false;
  }
}
