'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import AdminBriefingManager from '@/components/AdminBriefingManager';

import type { OptionChainData } from '@/types/options';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<OptionChainData[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'briefing'>('logs');

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    };
    
    // We only fetch logs if that tab is active to save bandwidth, but for now we fetch it once.
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 text-black">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">데이터 로그 & 브리핑 관리</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex gap-4 mb-6 border-b pb-4">
          <button 
            onClick={() => setActiveTab('logs')}
            className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'logs' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            데이터 수집 로그
          </button>
          <button 
            onClick={() => setActiveTab('briefing')}
            className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'briefing' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            마켓 브리핑 등록
          </button>
        </div>

        {activeTab === 'logs' ? (
          logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              수집된 로그 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-8">
              {logs.map((logGroup: OptionChainData, index: number) => (
                <div key={index} className="border p-4 rounded-lg bg-gray-50">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">
                      옵션 체인 데이터 (기준일: {logGroup.items[0]?.date || 'N/A'})
                    </h2>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                      수집: {new Date(logGroup.timestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <DataTable data={logGroup.items} showRawDataToggle={true} />
                </div>
              ))}
            </div>
          )
        ) : (
          <AdminBriefingManager />
        )}
      </div>
    </div>
  );
}
