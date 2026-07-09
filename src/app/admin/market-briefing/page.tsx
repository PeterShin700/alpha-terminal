'use client';

import AdminBriefingManager from '@/components/AdminBriefingManager';

export default function AdminMarketBriefingPage() {
  return (
    <div className="space-y-6 text-black">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">마켓 브리핑 등록</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <AdminBriefingManager />
      </div>
    </div>
  );
}
