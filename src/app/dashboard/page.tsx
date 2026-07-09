'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  value: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/chart/vkospi');
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        const json = await response.json();
        
        if (!json.data || json.data.length === 0) {
          setError('수집된 시세 데이터가 없습니다.');
        } else {
          setData(json.data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">VKOSPI 내재변동성 추이</h1>
          <p className="text-sm text-gray-500 mt-1">최근 60일간의 파생상품 시장 변동성 지표입니다.</p>
        </div>

        <div className="h-[400px] w-full flex items-center justify-center bg-gray-50/50 rounded-xl">
          {loading ? (
            // Skeleton UI
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium animate-pulse">시세 정보 로딩 중...</p>
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center text-red-500 space-y-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="font-semibold text-lg">{error}</p>
              <p className="text-sm text-gray-500">잠시 후 다시 시도해 주세요.</p>
            </div>
          ) : (
            // Recharts Chart
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                  itemStyle={{ color: '#2563eb', fontWeight: '500' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="내재변동성"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#2563eb' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#1d4ed8' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
