import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alpha Terminal - 선물옵션 투자자문 플랫폼",
  description: "데이터 기반 선물옵션 시장 분석 및 시황 정보",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 최상단 법적 경고 배너 */}
        <div className="bg-red-600 text-white text-xs md:text-sm font-bold text-center py-2 px-4 z-50 relative">
          [유사투자자문업 고지] 본 서비스는 유사투자자문업자로서 일대일 개별 투자 상담은 불가능하며, 파생상품 거래 결과와 손실은 투자자 본인에게 귀속된다.
        </div>
        
        {/* 네비게이션 헤더 */}
        <header className="sticky top-0 z-40 border-b bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/80 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold text-xl text-blue-900">Alpha Terminal</div>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm md:text-base">
            <a href="/briefing" className="hover:text-blue-600 font-medium">마켓 브리핑</a>
            <a href="/derivatives" className="hover:text-blue-600 font-medium">파생분석 센터</a>
            <a href="/macro" className="hover:text-blue-600 font-medium">글로벌 매크로</a>
            <a href="/liquidity" className="hover:text-blue-600 font-medium">대형 현물 수급</a>
          </nav>
        </header>

        <main className="min-h-screen bg-white">
          {children}
        </main>

        <footer className="bg-[#111827] text-white py-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
            <p className="font-bold text-gray-300">본 서비스는 유사투자자문업자로서 일대일 개별 투자 상담은 불가능하며, 파생상품 거래 결과와 손실은 투자자 본인에게 귀속된다.</p>
            <p className="text-sm text-gray-500 max-w-3xl mx-auto leading-relaxed">
              당사는 통신판매업 및 유사투자자문업 신고를 완료한 정식 사업자입니다. 제공되는 모든 정보는 투자 판단의 참고 자료일 뿐이며, 어떠한 경우에도 수익을 보장하지 않습니다.
            </p>
            <p className="text-xs text-gray-600 mt-6">
              © 2026 Alpha Terminal. All rights reserved.
            </p>
          </div>
        </footer>
        <Script src="https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
