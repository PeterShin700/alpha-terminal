'use client';
import { useState } from 'react';

export default function AdminLogsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">운영자용 데이터 로그 확인 모드</h1>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            로그아웃
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="text-gray-500">수집된 로그 데이터가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">날짜 (BasDt)</th>
                  <th className="border p-2">ATM 행사가 (Strike)</th>
                  <th className="border p-2">콜 종가 (Call Price)</th>
                  <th className="border p-2">풋 종가 (Put Price)</th>
                  <th className="border p-2 text-blue-600 font-bold">최종 양합 (Straddle Sum)</th>
                  <th className="border p-2">수집 시각 (Timestamp)</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="border p-2">{log.date}</td>
                    <td className="border p-2 font-medium">{log.strike.toFixed(2)}</td>
                    <td className="border p-2 text-red-600">{log.call}</td>
                    <td className="border p-2 text-blue-600">{log.put}</td>
                    <td className="border p-2 font-bold text-lg">{log.sum.toFixed(2)}</td>
                    <td className="border p-2 text-sm text-gray-500">{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
