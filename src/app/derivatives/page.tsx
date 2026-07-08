/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import DataTable from '@/components/DataTable';

export default function DerivativesPage() {
  const k2i1Ref = useRef<HTMLDivElement>(null);
  const vkospiRef = useRef<HTMLDivElement>(null);

  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [chartErrors, setChartErrors] = useState({ k2i1: false, vkospi: false });
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [optionsData, setOptionsData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // 1. Fetch Option Data
      try {
        const marketRes = await fetch('/api/market-data');
        const marketJson = await marketRes.json();
        if (marketJson.data && marketJson.data.weeklyOption) {
          setOptionsData(marketJson.data.weeklyOption);
        } else {
          setOptionsData(null);
        }
      } catch (err) {
        console.error("Failed to load options data", err);
        setOptionsData(null);
      } finally {
        setIsOptionsLoading(false);
      }

      // 2. Fetch Chart Data
      if (!(window as any).LightweightCharts) return;

      try {
        const [k2i1Res, vkospiRes] = await Promise.all([
          fetch('/api/chart-data/domestic?symbol=K2I1'),
          fetch('/api/chart-data/domestic?symbol=VKOSPI')
        ]);
        
        const k2i1Json = await k2i1Res.json();
        const vkospiJson = await vkospiRes.json();

        setIsLoadingCharts(false);

        // KOSPI 200 선물 (K2I1) 차트
        if (!k2i1Json.success) {
          setChartErrors(prev => ({ ...prev, k2i1: true }));
        } else if (k2i1Ref.current && !k2i1Ref.current.hasChildNodes()) {
          const k2i1Chart = (window as any).LightweightCharts.createChart(k2i1Ref.current, {
            width: k2i1Ref.current.clientWidth,
            height: 384,
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
            localization: { dateFormat: 'yyyy-MM-dd' },
          });
          const k2i1Series = k2i1Chart.addLineSeries({ color: '#2563eb', lineWidth: 2 });
          const mappedK2i1Data = k2i1Json.data.map((d: any) => ({ time: d.time, value: d.close || d.value }));
          k2i1Series.setData(mappedK2i1Data);
          k2i1Chart.timeScale().fitContent();
        }

        // VKOSPI 차트
        if (!vkospiJson.success) {
          setChartErrors(prev => ({ ...prev, vkospi: true }));
        } else if (vkospiRef.current && !vkospiRef.current.hasChildNodes()) {
          const vkospiChart = (window as any).LightweightCharts.createChart(vkospiRef.current, {
            width: vkospiRef.current.clientWidth,
            height: 384,
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
            localization: { dateFormat: 'yyyy-MM-dd' },
          });
          const vkospiSeries = vkospiChart.addLineSeries({ color: '#9333ea', lineWidth: 2 });
          const mappedVkospiData = vkospiJson.data.map((d: any) => ({ time: d.time, value: d.close || d.value }));
          vkospiSeries.setData(mappedVkospiData);
          vkospiChart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Failed to load derivative chart data", err);
        setIsLoadingCharts(false);
      }
    }
    
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">
      <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4">파생분석 센터 (선물/옵션)</h1>

      {/* 위클리 양합 타임라인 섹션 (복구됨) */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">위클리 양합 타임라인</h2>
        <div className="relative border-l-4 border-blue-500 ml-4 py-2 space-y-8">
          <div className="relative pl-6">
            <span className="absolute -left-[14px] bg-blue-500 w-6 h-6 rounded-full border-4 border-white shadow-sm"></span>
            <div className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-lg text-blue-800">최근 만기일 (D-Day)</h3>
              <p className="text-sm text-gray-500 mt-1">2026년 7월 둘째 주 위클리 옵션 만기</p>
              <div className="mt-3 flex items-center justify-between text-gray-700 font-medium">
                {isOptionsLoading ? (
                  <>
                    <span>전일 마감 양합 (로딩중)</span>
                    <span className="text-red-500 text-xl font-bold">...</span>
                  </>
                ) : optionsData ? (
                  <>
                    <span>전일 마감 양합 (EOD ATM {optionsData.atmPrice} 기준)</span>
                    <span className="text-red-500 text-xl font-bold">{optionsData.sum.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-gray-500 w-full text-center py-2 text-sm bg-gray-50 rounded">데이터를 불러오지 못했습니다. (API 장애 또는 데이터 없음)</span>
                )}
              </div>
              {optionsData && optionsData.apiRawStatus && (
                 <p className="text-xs font-semibold text-blue-500 mt-2 text-right">Data Source: {optionsData.apiRawStatus}</p>
              )}
            </div>
          </div>
          <div className="relative pl-6">
            <span className="absolute -left-[14px] bg-gray-300 w-6 h-6 rounded-full border-4 border-white shadow-sm"></span>
            <div className="bg-gray-50 border rounded-lg p-5">
              <h3 className="font-bold text-lg text-gray-700">D-1 (변동성 축소 구간)</h3>
              <p className="text-sm text-gray-500 mt-1">감마 리스크 프리미엄 축소 진행 중</p>
              <div className="mt-3 flex items-center justify-between text-gray-700">
                <span>프리미엄 붕괴 예측</span>
                <span className="text-gray-500 text-lg font-bold">
                  {optionsData && optionsData.items 
                    ? (optionsData.items.find((item: any) => item.isATM)?.d1Variance || 'N/A') 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 옵션 체인 데이터 표 섹션 */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">상세 옵션 체인 (Option Chain)</h2>
        {optionsData && optionsData.items && optionsData.items.length > 0 ? (
          <DataTable data={optionsData.items} showRawDataToggle={false} />
        ) : (
          <div className="text-gray-500 py-4 text-center border rounded-lg bg-gray-50">
            옵션 체인 데이터를 불러오는 중이거나 데이터가 없습니다.
          </div>
        )}
      </section>

      <section>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-blue-800 mb-2">KOSPI 200 선물 (K2I1)</h3>
            <div className="h-96 relative">
              <div ref={k2i1Ref} className="absolute inset-0" />
              {isLoadingCharts && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md border flex items-center justify-center text-gray-400 z-10">Loading Chart Data...</div>}
              {!isLoadingCharts && chartErrors.k2i1 && <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-500 z-10 rounded-md border">차트 데이터를 불러오지 못했습니다.</div>}
            </div>
          </div>
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-purple-700 mb-2">VKOSPI (변동성 지수)</h3>
            <div className="h-96 relative">
              <div ref={vkospiRef} className="absolute inset-0" />
              {isLoadingCharts && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md border flex items-center justify-center text-gray-400 z-10">Loading Chart Data...</div>}
              {!isLoadingCharts && chartErrors.vkospi && <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-500 z-10 rounded-md border">차트 데이터를 불러오지 못했습니다.</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
