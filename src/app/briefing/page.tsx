import MarketBriefing from '@/components/MarketBriefing';

export default function BriefingPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4">마켓 브리핑</h1>
      
      <MarketBriefing />

      <div className="bg-red-50 text-red-700 text-sm p-4 rounded-md text-center font-medium mt-12">
        ※ 본 게시판은 유사투자자문업 규정을 준수하여 댓글 및 의견 공유 기능이 원천 차단된 클린 읽기 전용 구조로 제공됩니다. (추후 로그인 기반 기능으로 개편 예정)
      </div>
    </div>
  );
}
