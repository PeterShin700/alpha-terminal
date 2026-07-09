'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import type { OptionChainData } from '@/types/options';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<OptionChainData[]>([]);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(0);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        // Sort descending by timestamp so latest is first
        const sortedData = data.sort((a: OptionChainData, b: OptionChainData) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sortedData);
      }
    };
    
    fetchLogs();
  }, []);

  const selectedLog = logs[selectedLogIndex];

  return (
    <div className="space-y-6 text-black">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">데이터 로그</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            수집된 로그 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-6">
              <label className="font-bold text-gray-700 whitespace-nowrap">과거 데이터 조회:</label>
              <select 
                className="w-full max-w-md p-2.5 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                value={selectedLogIndex}
                onChange={(e) => setSelectedLogIndex(Number(e.target.value))}
              >
                {logs.map((logGroup, idx) => (
                  <option key={idx} value={idx}>
                    기준일: {logGroup.items[0]?.date || 'N/A'} (수집일시: {new Date(logGroup.timestamp).toLocaleString('ko-KR')})
                  </option>
                ))}
              </select>
            </div>

            {selectedLog && (
              <div className="border p-4 rounded-lg bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    옵션 체인 데이터 (기준일: {selectedLog.items[0]?.date || 'N/A'})
                  </h2>
                  <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                    수집: {new Date(selectedLog.timestamp).toLocaleString('ko-KR')}
                  </span>
                </div>
                <DataTable data={selectedLog.items} showRawDataToggle={true} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
