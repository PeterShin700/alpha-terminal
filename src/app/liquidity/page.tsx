/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

export default function LiquidityPage() {
  const ssRef = useRef<HTMLDivElement>(null);
  const skRef = useRef<HTMLDivElement>(null);

  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [netForeign, setNetForeign] = useState<number | null>(null);
  const [netInstitution, setNetInstitution] = useState<number | null>(null);
  const [programTrend, setProgramTrend] = useState<number[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/market-data');
        const json = await res.json();
        if (json.success && json.data.liquidity) {
          const liq = json.data.liquidity;
          if (liq.investorNet) {
            setNetForeign(liq.investorNet.foreign);
            setNetInstitution(liq.investorNet.institution);
          }
          if (liq.programTrading) {
            setProgramTrend(liq.programTrading.trend);
          }
        }
      } catch (err) {
        console.error("Failed to load liquidity data", err);
      }
    }
    fetchData();

    async function renderCharts() {
      if (!(window as any).LightweightCharts) return;

      try {
        const [ssRes, skRes] = await Promise.all([
          fetch('/api/chart-data/domestic?symbol=005930'),
          fetch('/api/chart-data/domestic?symbol=000660')
        ]);
        
        const ssJson = await ssRes.json();
        const skJson = await skRes.json();

        setIsLoadingCharts(false);

        // 삼성전자 차트
        if (ssRef.current && !ssRef.current.hasChildNodes() && ssJson.success) {
          const ssChart = (window as any).LightweightCharts.createChart(ssRef.current, {
            width: ssRef.current.clientWidth,
            height: 320,
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
          });
          const ssSeries = ssChart.addCandlestickSeries();
          ssSeries.setData(ssJson.data);
          ssChart.timeScale().fitContent();

          const ssObserver = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect) {
              ssChart.applyOptions({ width: entries[0].contentRect.width });
            }
          });
          ssObserver.observe(ssRef.current);
        }

        // SK하이닉스 차트
        if (skRef.current && !skRef.current.hasChildNodes() && skJson.success) {
          const skChart = (window as any).LightweightCharts.createChart(skRef.current, {
            width: skRef.current.clientWidth,
            height: 320,
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
          });
          const skSeries = skChart.addCandlestickSeries();
          skSeries.setData(skJson.data);
          skChart.timeScale().fitContent();

          const skObserver = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect) {
              skChart.applyOptions({ width: entries[0].contentRect.width });
            }
          });
          skObserver.observe(skRef.current);
        }
      } catch (err) {
        console.error("Failed to load domestic chart data", err);
        setIsLoadingCharts(false);
      }
    }
    
    renderCharts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-8 space-y-8 md:space-y-12">
      <h1 className="text-2xl font-black mb-6 text-center">대형 현물 수급</h1>

      <section>
        <h2 className="text-xl font-bold mb-4">투자자별 & 프로그램 누적 매매동향 다이어그램</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[250px] bg-white">
            <h3 className="font-bold text-gray-700 mb-6">기관 및 외국인 선물 순매수량</h3>
            {netForeign !== null ? (
              <div className="flex gap-4">
                <div className={`px-6 py-2 rounded font-bold ${netForeign > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  외인: {netForeign > 0 ? '+' : ''}{netForeign}계약
                </div>
                <div className={`px-6 py-2 rounded font-bold ${netInstitution! > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  기관: {netInstitution! > 0 ? '+' : ''}{netInstitution}계약
                </div>
              </div>
            ) : (
              <div className="h-24 border-dashed border-gray-300 border flex flex-col items-center justify-center text-sm text-gray-400 bg-gray-50 w-full rounded-md">
                <span className="mb-2">[누적 순매수량 데이터 파이프라인 연동 대기중]</span>
                <div className="flex gap-4 w-full px-8 mt-2">
                  <div className="flex-1 bg-red-100 p-2 text-center text-red-600 rounded font-bold text-xs">외인: +2,500계약</div>
                  <div className="flex-1 bg-blue-100 p-2 text-center text-blue-600 rounded font-bold text-xs">기관: -1,200계약</div>
                </div>
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[250px] bg-white">
            <h3 className="font-bold text-gray-700 mb-6">프로그램 비차익 매수 유입 추이</h3>
            {programTrend !== null ? (
              <div className="flex gap-2">
                {programTrend.map((val, idx) => {
                  const labels = ["D-4", "D-3", "D-2", "D-1", "오늘"];
                  const label = labels[idx] || `D-${4-idx}`;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-14 text-center text-xs font-bold p-2 rounded ${val > 0 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        {val > 0 ? '+' : ''}{val}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-24 border-dashed border-gray-300 border w-full flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-md">
                [프로그램 매매 트렌드 데이터 파이프라인 연동 대기중]
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">반도체 투톱(삼성전자·SK하이닉스) 차트</h2>
        <div className="border rounded-lg p-6 shadow-sm bg-white">
          <p className="text-gray-600 mb-6 text-sm">국내 지수를 견인하는 핵심 대형주 차트 분석을 통해 파생 시장의 상승 지속력 및 붕괴 가능성을 가늠합니다.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">삼성전자 (005930)</h4>
              <div className="h-80 relative">
                <div ref={ssRef} className="absolute inset-0" />
                {isLoadingCharts && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md border flex items-center justify-center text-gray-400 z-10">Loading Chart Data...</div>}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">SK하이닉스 (000660)</h4>
              <div className="h-80 relative">
                <div ref={skRef} className="absolute inset-0" />
                {isLoadingCharts && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md border flex items-center justify-center text-gray-400 z-10">Loading Chart Data...</div>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
