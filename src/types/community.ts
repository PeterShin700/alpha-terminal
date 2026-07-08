export interface Post {
  id?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  likes: number;
  dislikes: number;
  commentCount: number;
}

export interface Comment {
  id?: string;
  postId: string;
  parentId: string | null; // null 이면 원댓글, 값이 있으면 대댓글
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  likes: number;
  dislikes: number;
}
