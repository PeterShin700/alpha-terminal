export default function BriefingPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4">마켓 브리핑</h1>
      
      <div className="bg-gray-50 border p-6 rounded-lg">
        <div className="text-sm text-gray-500 mb-2">2026.07.07 장 마감 브리핑</div>
        <h2 className="text-2xl font-bold mb-4">전일 장 마감 종합 분석 및 거시경제 이벤트</h2>
        <p className="text-gray-700 leading-relaxed space-y-4">
          금일 국내 파생 시장은 글로벌 금리 이슈와 맞물려 높은 변동성을 보였습니다. 
          주요 저항선을 테스트하는 흐름이 이어졌으며, 특히 외국인 프로그램 매수세가 장 후반 급격히 유입되었습니다.<br/><br/>
          (이하 정제된 단방향 칼럼 내용)
        </p>
      </div>

      <div className="bg-red-50 text-red-700 text-sm p-4 rounded-md text-center font-medium">
        ※ 본 게시판은 유사투자자문업 규정을 준수하여 댓글 및 의견 공유 기능이 원천 차단된 클린 읽기 전용 구조로 제공됩니다.
      </div>
    </div>
  );
}
