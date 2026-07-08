'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  loginWithGoogle, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  updateProfile,
  auth
} from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setNickname('');
    setError('');
  };

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      onClose();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message || '구글 로그인 중 오류가 발생했습니다.');
      } else {
        setError('구글 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== passwordConfirm) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
        if (!nickname.trim()) {
          throw new Error('닉네임을 입력해주세요.');
        }

        // 회원가입
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 닉네임 설정
        await updateProfile(user, { displayName: nickname });

        // 이메일 인증 발송
        await sendEmailVerification(user);
        
        // 인증 유도를 위해 즉시 로그아웃 처리
        await auth.signOut();

        alert('회원가입이 완료되었습니다. 이메일함에서 인증 링크를 클릭하신 후 로그인해주세요.');
        setMode('login');
        resetForm();

      } else {
        // 로그인
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          await auth.signOut();
          throw new Error('이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.');
        }

        onClose();
      }
    } catch (e: unknown) {
      console.error(e);
      // Firebase 에러 메시지를 사용자 친화적으로 변환
      let msg = '오류가 발생했습니다.';
      if (e instanceof Error) {
        msg = e.message;
        const err = e as { code?: string };
        if (err.code === 'auth/email-already-in-use') msg = '이미 사용 중인 이메일입니다.';
        else if (err.code === 'auth/invalid-credential') msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
        else if (err.code === 'auth/weak-password') msg = '비밀번호는 6자리 이상이어야 합니다.';
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="커뮤니티에서 사용할 이름"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6자리 이상"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                <input 
                  type="password" 
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            )}

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '처리 중...' : (mode === 'login' ? '이메일로 로그인' : '이메일로 가입하기')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <button 
              onClick={handleGoogleAuth}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {mode === 'login' ? 'Google 계정으로 로그인' : 'Google 계정으로 3초 만에 가입하기'}
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                아직 계정이 없으신가요?{' '}
                <button onClick={handleToggleMode} className="text-blue-600 font-bold hover:underline">
                  회원가입하기
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button onClick={handleToggleMode} className="text-blue-600 font-bold hover:underline">
                  로그인하기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
