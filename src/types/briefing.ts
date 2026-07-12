export interface Briefing {
  id?: string;
  content: string;
  createdAt: number; // Unix timestamp
  likes: number;
  dislikes: number;
  // 향후 로그인 기능 확장에 대비한 필드 설계 (옵션)
  // authorId?: string; 
  // status?: 'published' | 'draft';
  adminComments?: {
    id: string;
    content: string;
    createdAt: number;
    authorName: string;
  }[];
}
