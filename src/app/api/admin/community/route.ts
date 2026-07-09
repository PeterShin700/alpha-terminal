import { NextResponse } from 'next/server';
import { getAdminAuth, getDb } from '@/lib/firebase-admin';

// Admin verification
async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const isRootAdmin = decodedToken.email === process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL;
    const isCustomAdmin = decodedToken.admin === true;

    if (!isRootAdmin && !isCustomAdmin) {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }

    return { user: decodedToken };
  } catch {
    return { error: 'Invalid token', status: 401 };
  }
}

// POST: Add mock data
export async function POST(request: Request) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const db = getDb();
    
    const mockPosts = [
      { authorName: "파생고수", content: "오늘 KOSPI200 옵션 변동성 어떻게 보시나요? 장 초반부터 프리미엄이 꽤 붙어있는 느낌이네요.", likes: 12, dislikes: 1, commentCount: 3 },
      { authorName: "옵션초보", content: "위클리 옵션 만기일이라 롤오버 해야할지 고민입니다. 조언 부탁드려요.", likes: 5, dislikes: 0, commentCount: 2 },
      { authorName: "매크로분석가", content: "최근 환율 흐름이 심상치 않네요. 외국인 현물 매도세랑 겹쳐서 당분간 하방 압력이 강할 것 같습니다.", likes: 24, dislikes: 2, commentCount: 5 },
      { authorName: "델타중립", content: "어제 올려주신 마켓 브리핑 자료 잘 봤습니다! 덕분에 방향성 잡는데 큰 도움이 되었습니다.", likes: 8, dislikes: 0, commentCount: 1 },
      { authorName: "시스템트레이더", content: "VKOSPI 지수 차트가 지난주부터 급등락을 반복하고 있는데, 백테스팅 결과로는 지금이 양매도 진입하기엔 리스크가 커 보입니다.", likes: 15, dislikes: 3, commentCount: 4 },
      { authorName: "가치투자자", content: "파생상품은 아니지만 대형 현물 수급을 보니 반도체 섹터로 자금이 몰리고 있네요.", likes: 10, dislikes: 1, commentCount: 2 },
      { authorName: "리스크관리", content: "최근 증거금률 인상 소식 들으셨나요? 포지션 사이즈 조절에 유의하셔야 할 것 같습니다.", likes: 18, dislikes: 0, commentCount: 0 },
      { authorName: "단타요정", content: "오늘 장 막판에 옵션 양합이 갑자기 죽는 현상이 있었는데, 혹시 이유 아시는 분 계신가요?", likes: 6, dislikes: 0, commentCount: 1 },
    ];

    const batch = db.batch();
    
    // Create posts
    const postIds: string[] = [];
    for (const post of mockPosts) {
      const docRef = db.collection('community_posts').doc();
      postIds.push(docRef.id);
      
      const now = Date.now() - Math.floor(Math.random() * 86400000 * 3); // Random time within last 3 days
      
      batch.set(docRef, {
        authorId: "mock-user-id",
        authorName: post.authorName,
        content: post.content,
        likes: post.likes,
        dislikes: post.dislikes,
        commentCount: post.commentCount,
        createdAt: now
      });
    }

    // Optional: add some mock comments
    const mockComments = [
      "저도 동의합니다.", "좋은 관점이네요. 감사합니다.", "조금 더 지켜봐야 할 것 같아요.", "저는 반대로 생각합니다."
    ];

    for (let i = 0; i < postIds.length; i++) {
      const pId = postIds[i];
      const cCount = mockPosts[i].commentCount;
      
      for (let j = 0; j < cCount; j++) {
        const cRef = db.collection('community_comments').doc();
        batch.set(cRef, {
          postId: pId,
          authorId: "mock-commenter-id",
          authorName: "익명유저" + (Math.floor(Math.random() * 100)),
          content: mockComments[Math.floor(Math.random() * mockComments.length)],
          likes: Math.floor(Math.random() * 5),
          dislikes: 0,
          createdAt: Date.now() - Math.floor(Math.random() * 86400000)
        });
      }
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Mock data generated successfully.' });
  } catch (error) {
    console.error('Error seeding community data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete all data
export async function DELETE(request: Request) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const db = getDb();
    
    // Delete all posts
    const postsSnap = await db.collection('community_posts').get();
    const batch = db.batch();
    postsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete all comments
    const commentsSnap = await db.collection('community_comments').get();
    commentsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: 'All community data deleted successfully.' });
  } catch (error) {
    console.error('Error deleting community data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
