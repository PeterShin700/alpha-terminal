/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

export default function MacroPage() {
  const nqRef = useRef<HTMLDivElement>(null);
  const clRef = useRef<HTMLDivElement>(null);

  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    async function renderCharts() {
      if (!(window as any).LightweightCharts) return;

      try {
        const [nqRes, clRes, tableRes] = await Promise.all([
          fetch('/api/chart-data/global?symbol=NQ=F'),
          fetch('/api/chart-data/global?symbol=CL=F'),
          fetch('/api/macro-table')
        ]);
        
        const nqJson = await nqRes.json();
        const clJson = await clRes.json();
        const tableJson = await tableRes.json();
        if (tableJson.success && tableJson.data) {
          setTableData(tableJson.data);
        }

        setIsLoadingCharts(false);

        // NQ1! (나스닥 100 선물) 차트
        if (nqRef.current && !nqRef.current.hasChildNodes() && nqJson.success) {
          const nqChart = (window as any).LightweightCharts.createChart(nqRef.current, {
            width: nqRef.current.clientWidth,
            height: 384,
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
          });
          const nqSeries = nqChart.addCandlestickSeries();
          nqSeries.setData(nqJson.data);
          nqChart.timeScale().fitContent();

          const nqObserver = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect) {
              nqChart.applyOptions({ width: entries[0].contentRect.width });
            }
          });
          nqObserver.observe(nqRef.current);
        }

        // CL1! (크루드 오일) 차트
        if (clRef.current && !clRef.current.hasChildNodes() && clJson.success) {
          const clChart = (window as any).LightweightCharts.createChart(clRef.current, {
            width: clRef.current.clientWidth,
            height: 384,
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
          });
          const clSeries = clChart.addCandlestickSeries();
          clSeries.setData(clJson.data);
          clChart.timeScale().fitContent();

          const clObserver = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect) {
              clChart.applyOptions({ width: entries[0].contentRect.width });
            }
          });
          clObserver.observe(clRef.current);
        }
      } catch (err) {
        console.error("Failed to load global chart data", err);
        setIsLoadingCharts(false);
      }
    }
    
    renderCharts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 space-y-8 md:space-y-12">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-b pb-4">글로벌 매크로</h1>

      <section>
        <h2 className="text-xl font-bold mb-4">나스닥 100 선물 & 크루드 오일 다중 비교 스냅샷</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-blue-800 mb-2">NQ1! (나스닥 100 선물)</h3>
            <div className="h-96 relative">
              <div ref={nqRef} className="absolute inset-0" />
              {isLoadingCharts && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md border flex items-center justify-center text-gray-400 z-10">Loading Chart Data...</div>}
            </div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-yellow-700 mb-2">CL1! (크루드 오일)</h3>
            <div className="h-96 relative">
              <div ref={clRef} className="absolute inset-0" />
              {isLoadingCharts && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md border flex items-center justify-center text-gray-400 z-10">Loading Chart Data...</div>}
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm text-gray-600 text-center">
          두 자산군의 역사적 상관관계 수치: <span className="font-bold text-gray-900">-0.24 (최근 30일 기준)</span>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">글로벌 수급 밸런스 분석 테이블</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">자산군</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">포지션 비율</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">주요 지지선</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">주요 저항선</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 animate-pulse">CFTC 롱/숏 밸런스 데이터를 분석 중입니다...</td>
                </tr>
              ) : tableData.map((row, idx) => {
                // 'Long X% / Short Y%' 형태에서 비율을 읽어 스타일링 보조
                const isLongHeavy = row.position.includes('Long') && parseInt(row.position.split('Long ')[1]) > 50;
                
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{row.asset}</td>
                    <td className={`py-4 px-6 font-semibold whitespace-nowrap ${isLongHeavy ? 'text-blue-600' : 'text-red-600'}`}>{row.position}</td>
                    <td className="py-4 px-6 whitespace-nowrap">{row.support}</td>
                    <td className="py-4 px-6 whitespace-nowrap">{row.resistance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
