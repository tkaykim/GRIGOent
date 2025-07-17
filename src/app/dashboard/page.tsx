"use client";
import { useAuth } from "../../components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../../components/Header";
import { LogOut, User, Settings, FileText, Shield, Clock, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // 권한별 대시보드 분기
  useEffect(() => {
    if (user && !loading) {
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'choreographer':
        case 'partner_choreographer':
          router.push('/choreographer/dashboard');
          break;
        case 'client':
          router.push('/client/dashboard');
          break;
        case 'general':
        default:
          // 일반회원은 현재 페이지에서 계속
          break;
      }
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

  // 일반회원 대시보드 (승인 대기 중인 경우)
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'general': return '일반회원';
      case 'client': return '클라이언트';
      case 'choreographer': return '전속댄서';
      case 'partner_choreographer': return '파트너댄서';
      case 'admin': return '관리자';
      default: return role;
    }
  };

  const getPendingRoleLabel = (pendingRole: string) => {
    switch (pendingRole) {
      case 'client': return '클라이언트';
      case 'choreographer': return '전속댄서';
      case 'partner_choreographer': return '파트너댄서';
      default: return pendingRole;
    }
  };

  const isPendingApproval = user.pending_role && user.pending_role !== user.role;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      <Header title="대시보드" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">대시보드</h1>
            <p className="text-white/60">안녕하세요, {user.name || user.email}님!</p>
          </div>

          {/* 승인 대기 알림 */}
          {isPendingApproval && user.pending_role && (
            <div className="mb-8 p-6 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-start">
                <Clock className="w-6 h-6 text-orange-400 mr-4 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-400 text-lg mb-2">권한 승인 대기 중</h3>
                  <p className="text-white/80 mb-3">
                    <strong>{getPendingRoleLabel(user.pending_role)}</strong> 권한 승인을 요청하셨습니다.
                    관리자 검토 후 승인되면 해당 권한으로 서비스를 이용하실 수 있습니다.
                  </p>
                  <div className="text-sm text-white/60">
                    <p>• 현재 권한: {getRoleLabel(user.role || 'general')}</p>
                    <p>• 신청 권한: {getPendingRoleLabel(user.pending_role)}</p>
                    <p>• 가입일: {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 사용자 정보 카드 */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">사용자 정보</h2>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(user.role || 'general')}`}>
                  {getRoleLabel(user.role || 'general')}
                </span>
                {isPendingApproval && (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-orange-500 text-white">
                    승인 대기
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  기본 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-sm">이름</label>
                    <p className="text-white font-medium">{user.name || '미입력'}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">이메일</label>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">전화번호</label>
                    <p className="text-white font-medium">{user.phone || '미입력'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  권한 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-sm">현재 권한</label>
                    <p className="text-white font-medium">{getRoleLabel(user.role || 'general')}</p>
                  </div>
                  {isPendingApproval && user.pending_role && (
                    <div>
                      <label className="text-white/60 text-sm">신청 권한</label>
                      <p className="text-white font-medium">{getPendingRoleLabel(user.pending_role)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-white/60 text-sm">가입일</label>
                    <p className="text-white font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 일반회원 안내 */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              일반회원 안내
            </h2>
            <p className="text-white/80 mb-4">
              현재 일반회원으로 가입되어 있습니다. 아티스트 조회 및 문의 작성이 가능합니다.
            </p>
            
            {isPendingApproval && user.pending_role && (
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-blue-400 mb-2">승인 후 이용 가능한 기능</h4>
                <p className="text-white/80 text-sm">
                  {user.pending_role === 'client' ? 
                    '클라이언트로 승인되면 안무가에게 직접 문의하고 프로젝트를 진행할 수 있습니다.' :
                    '댄서로 승인되면 프로필과 경력을 관리하고 클라이언트의 문의를 받을 수 있습니다.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-white text-black py-3 px-6 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              홈으로 이동
            </button>
            <button
              onClick={() => router.push("/artists")}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              아티스트 보기
            </button>
            <button
              onClick={() => router.push("/contact")}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              문의하기
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-red-600 text-white';
    case 'choreographer':
      return 'bg-green-600 text-white';
    case 'partner_choreographer':
      return 'bg-purple-600 text-white';
    case 'client':
      return 'bg-blue-600 text-white';
    case 'general':
      return 'bg-gray-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
} 