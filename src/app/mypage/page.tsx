'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateUserProfile } from '@/lib/user-api';
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
          <select 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
          >
            <option value="">선택 안 함</option>
            <option value="서울">서울특별시</option>
            <option value="부산">부산광역시</option>
            <option value="대구">대구광역시</option>
            <option value="인천">인천광역시</option>
            <option value="광주">광주광역시</option>
            <option value="대전">대전광역시</option>
            <option value="울산">울산광역시</option>
            <option value="세종">세종특별자치시</option>
            <option value="경기">경기도</option>
            <option value="강원">강원특별자치도</option>
            <option value="충북">충청북도</option>
            <option value="충남">충청남도</option>
            <option value="전북">전북특별자치도</option>
            <option value="전남">전라남도</option>
            <option value="경북">경상북도</option>
            <option value="경남">경상남도</option>
            <option value="제주">제주특별자치도</option>
          </select>
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
