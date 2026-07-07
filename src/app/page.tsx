export default function Home() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 text-center">
      <section className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900">
          데이터 기반 선물옵션 시장 분석
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          철저한 분석과 객관적인 데이터를 통해 글로벌 파생상품 시장의 흐름을 읽습니다. 
          과장된 수익률 약속 없이, 오직 정제된 정보만을 단방향으로 제공합니다.
        </p>
        <div className="pt-4">
          <a href="/market" className="bg-blue-600 text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-blue-700 transition">
            시황 분석 바로가기
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 pt-12 text-left">
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-3">객관적 데이터</h3>
          <p className="text-gray-600">TradingView 기반의 공신력 있는 차트와 공공데이터를 결합하여 정확한 시장 현황을 전달합니다.</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-3">안전한 정보 수신</h3>
          <p className="text-gray-600">불필요한 노이즈를 제거한 단방향 정보 제공 채널을 통해 안정적인 투자 환경을 지원합니다.</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-3">투명한 운영</h3>
          <p className="text-gray-600">유사투자자문업 가이드라인을 엄격히 준수하며, 1:1 리딩이나 불법 자문 행위를 철저히 차단합니다.</p>
        </div>
      </section>
    </div>
  );
}
