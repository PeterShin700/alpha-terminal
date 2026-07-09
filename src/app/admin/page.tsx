'use client';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">대시보드 홈</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
          <h3 className="text-gray-500 font-bold mb-2">활성 관리자 시스템</h3>
          <p className="text-3xl font-black text-gray-900">정상 작동 중</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-indigo-500">
          <h3 className="text-gray-500 font-bold mb-2">유저 권한 제어</h3>
          <p className="text-3xl font-black text-gray-900">Active</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
          <h3 className="text-gray-500 font-bold mb-2">브리핑 및 로그 상태</h3>
          <p className="text-3xl font-black text-gray-900">Active</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mt-8">
        <h2 className="text-xl font-bold text-blue-900 mb-2">👋 통합 관리자 대시보드에 오신 것을 환영합니다!</h2>
        <p className="text-blue-800">
          좌측 메뉴를 통해 전체 회원을 관리하거나, 시장 브리핑을 작성하고 수집된 데이터 로그를 모니터링 할 수 있습니다.<br/>
          최고 관리자 권한 부여 및 회수, 악성 유저 차단 등의 기능은 [유저 관리] 탭에서 가능합니다.
        </p>
      </div>
    </div>
  );
}
