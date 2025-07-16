"use client";
import { useAuth } from "../../components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../../components/Header";
import { LogOut, User, Settings, FileText, Shield } from "lucide-react";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <>
        <Header title="대시보드" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client': return '클라이언트';
      case 'choreographer': return '전속안무가';
      case 'partner_choreographer': return '파트너안무가';
      case 'admin': return '관리자';
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'client': return '아티스트 조회 및 문의 작성이 가능합니다.';
      case 'choreographer': return '프로필 관리 및 경력 등록이 가능합니다.';
      case 'partner_choreographer': return '프로필 관리 및 경력 등록이 가능합니다.';
      case 'admin': return '전체 시스템 관리가 가능합니다.';
      default: return '';
    }
  };

  return (
    <>
      <Header title="대시보드" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto py-16 px-4">
          <h1 className="text-4xl font-bold mb-8">대시보드</h1>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">사용자 정보</h2>
            <div className="space-y-2">
              <p><strong>이름:</strong> {user.name || '미설정'}</p>
              <p><strong>이메일:</strong> {user.email}</p>
              <p><strong>권한:</strong> {getRoleLabel(user.role || 'client')}</p>
              <p><strong>전화번호:</strong> {user.phone || '미설정'}</p>
              <p className="text-white/60 text-sm mt-2">{getRoleDescription(user.role || 'client')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">빠른 메뉴</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  프로필 수정
                </button>
                <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  문의 내역
                </button>
                {(user.role === 'choreographer' || user.role === 'partner_choreographer') && (
                  <button 
                    onClick={() => router.push('/choreographer/profile')}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    프로필 관리
                  </button>
                )}
                {user.role === 'admin' && (
                  <button 
                    onClick={() => router.push('/admin')}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    관리자 페이지
                  </button>
                )}
                <button 
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push('/');
                    } catch (error) {
                      console.error('로그아웃 중 오류:', error);
                      router.push('/');
                    }
                  }}
                  className="w-full text-left p-3 bg-red-600/20 hover:bg-red-600/30 rounded transition-colors flex items-center text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">최근 활동</h3>
              <p className="text-white/60">아직 활동 내역이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 