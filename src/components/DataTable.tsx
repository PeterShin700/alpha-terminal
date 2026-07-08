'use client';
import { useEffect, useRef, useState } from 'react';
import { OptionChainItem } from '@/types/options';

interface DataTableProps {
  data: OptionChainItem[];
  showRawDataToggle?: boolean;
}

export default function DataTable({ data, showRawDataToggle = false }: DataTableProps) {
  const [showRaw, setShowRaw] = useState(false);
  const atmRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (atmRef.current) {
      atmRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [data]);

  const formatPrice = (price: number | null) => {
    return price !== null ? price.toFixed(2) : '-';
  };

  const formatVariance = (variance: number | null | 'N/A') => {
    if (variance === 'N/A' || variance === null) return <span className="text-gray-400">N/A</span>;
    if (variance === 0) return <span className="text-gray-500">0.00%</span>;
    if (variance > 0) return <span className="text-red-500 font-semibold">+{variance.toFixed(2)}%</span>;
    return <span className="text-blue-500 font-semibold">{variance.toFixed(2)}%</span>;
  };

  return (
    <div className="w-full">
      {showRawDataToggle && (
        <div className="mb-4 flex justify-end">
          <button 
            onClick={() => setShowRaw(!showRaw)}
            className="bg-gray-800 text-white px-3 py-1 text-sm rounded hover:bg-gray-700 transition"
          >
            {showRaw ? '테이블 뷰로 돌아가기' : 'Raw Data 확인하기'}
          </button>
        </div>
      )}

      {showRaw ? (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-96 text-xs font-mono">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <div className="border rounded-lg shadow-sm bg-white overflow-y-auto max-h-96 relative">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr>
                {showRawDataToggle && <th className="px-4 py-3">상품 구분 (prdCtg)</th>}
                {showRawDataToggle && <th className="px-4 py-3">종목명 (itmsNm)</th>}
                <th className="px-4 py-3">데이터 수집일</th>
                <th className="px-4 py-3">행사가</th>
                <th className="px-4 py-3 text-red-600">콜 종가</th>
                <th className="px-4 py-3 text-blue-600">풋 종가</th>
                <th className="px-4 py-3 font-bold text-gray-900">양합</th>
                <th className="px-4 py-3">D-1 (변동성)</th>
                <th className="px-4 py-3">비고</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const isATM = row.isATM;
                return (
                  <tr 
                    key={`${row.date}-${row.strike}-${idx}`}
                    ref={isATM ? atmRef : null}
                    className={`border-b hover:bg-gray-50 transition-colors ${isATM ? 'bg-[#e6f7ff]' : 'bg-white'}`}
                  >
                    {showRawDataToggle && <td className="px-4 py-3 text-xs text-gray-500">{row.prdCtg || '-'}</td>}
                    {showRawDataToggle && <td className="px-4 py-3 text-xs font-semibold text-gray-700">{row.itmsNm || '-'}</td>}
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3 font-semibold">{row.strike.toFixed(2)}</td>
                    <td className="px-4 py-3 text-red-600">{formatPrice(row.call)}</td>
                    <td className="px-4 py-3 text-blue-600">{formatPrice(row.put)}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{formatPrice(row.sum)}</td>
                    <td className="px-4 py-3">{formatVariance(row.d1Variance)}</td>
                    <td className="px-4 py-3 font-bold text-blue-800">
                      {isATM ? 'ATM (등가격)' : ''}
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={showRawDataToggle ? 9 : 7} className="text-center py-8 text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
