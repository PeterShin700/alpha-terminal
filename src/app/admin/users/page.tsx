/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: string;
  creationTime: string;
  lastSignInTime: string;
  disabled: boolean;
  isAdmin: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error('Failed to fetch users');
      }
      const data = JSON.parse(await res.text());
      setUsers(data);
    } catch (error) {
      console.error(error);
      alert('유저 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (uid: string, action: 'toggle_admin' | 'toggle_disabled' | 'delete') => {
    if (action === 'delete' && !confirm('정말로 이 사용자를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const method = action === 'delete' ? 'DELETE' : 'PATCH';
      
      const res = await fetch(`/api/admin/users/${uid}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined
      });

      if (!res.ok) throw new Error('Action failed');
      
      // Refresh list
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert('요청하신 작업을 수행하는데 실패했습니다.');
    }
  };

  if (loading) return <div className="text-gray-500 font-bold">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">유저 관리</h1>
      
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">사용자</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">가입일</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">관리자 여부</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.uid} className={user.disabled ? 'bg-red-50' : 'hover:bg-gray-50 transition-colors'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.photoURL ? (
                      <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{user.displayName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.creationTime).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {user.disabled ? '정지됨' : '활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.isAdmin ? (
                    <span className="text-blue-600 font-bold">👑 최고 관리자</span>
                  ) : (
                    <span className="text-gray-400">일반 회원</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button 
                    onClick={() => handleAction(user.uid, 'toggle_admin')}
                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                  >
                    {user.isAdmin ? '권한 회수' : '관리자 임명'}
                  </button>
                  <button 
                    onClick={() => handleAction(user.uid, 'toggle_disabled')}
                    className="text-orange-600 hover:text-orange-900 bg-orange-50 px-3 py-1 rounded"
                  >
                    {user.disabled ? '정지 해제' : '계정 정지'}
                  </button>
                  <button 
                    onClick={() => handleAction(user.uid, 'delete')}
                    className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                  >
                    영구 삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
