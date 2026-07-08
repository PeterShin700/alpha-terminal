'use client';
import { useState } from 'react';
import DataTable from '@/components/DataTable';
import AdminBriefingManager from '@/components/AdminBriefingManager';

import type { OptionChainData } from '@/types/options';

export default function AdminLogsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState<OptionChainData[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'briefing'>('logs');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-96 text-center">
          <h1 className="text-2xl font-bold mb-4">관리자 인증</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="border p-2 rounded focus:outline-blue-500 text-black"
            />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`text-xl font-bold px-2 py-1 ${activeTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              데이터 로그
            </button>
            <button 
              onClick={() => setActiveTab('briefing')}
              className={`text-xl font-bold px-2 py-1 ${activeTab === 'briefing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              마켓 브리핑 관리
            </button>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            로그아웃
          </button>
        </div>

        {activeTab === 'logs' ? (
          logs.length === 0 ? (
            <p className="text-gray-500">수집된 로그 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-8">
              {logs.map((logGroup: OptionChainData, index: number) => (
                <div key={index} className="border p-4 rounded bg-gray-50">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">
                      옵션 체인 데이터 (기준일: {logGroup.items[0]?.date || 'N/A'})
                    </h2>
                    <span className="text-sm text-gray-500">수집: {new Date(logGroup.timestamp).toLocaleString('ko-KR')}</span>
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
