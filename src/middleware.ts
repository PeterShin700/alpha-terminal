import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 정적 리소스(이미지, CSS 등)는 로깅에서 제외
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Audit Trail (감사 로그): 금융당국 소명 대비
  // 실제 프로덕션 환경에서는 DB나 외부 로깅 시스템(Datadog, AWS CloudWatch 등)으로 전송
  console.log(`[AUDIT] Timestamp: ${new Date().toISOString()} | Path: ${pathname} | IP: ${request.ip || 'Unknown'} | Agent: ${request.headers.get('user-agent')}`);

  return NextResponse.next();
}
