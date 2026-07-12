'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/user-api';
import { updateProfile } from 'firebase/auth';

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      alert('로그인이 필요한 페이지입니다.');
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setDisplayName(user.displayName || '');
      
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setPhoneNumber(profile.phoneNumber || '');
        setRegion(profile.region || '');
      }
      setIsFetching(false);
    }
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // 1. Update Firebase Auth Profile (Nickname)
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      // 2. Update Firestore (Phone number, Region)
      await updateUserProfile(user.uid, {
        phoneNumber,
        region
      });

      alert('성공적으로 저장되었습니다.');
      // Force reload to update the header
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">마이페이지</h1>
      
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">닉네임</label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="사용하실 닉네임을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">거주 지역 (선택)</label>
          <input 
            type="text" 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="예: 서울, 부산, 경기 등"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">전화번호 (선택)</label>
          <input 
            type="tel" 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="010-0000-0000"
          />
        </div>

        <div className="pt-6">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
