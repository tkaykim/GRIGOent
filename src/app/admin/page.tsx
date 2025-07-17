"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import Header from "../../components/Header";
import { Users, UserCheck, MessageSquare, BarChart3, Clock, AlertCircle } from "lucide-react";
import { supabase } from "../../utils/supabase";

interface DashboardStats {
  totalUsers: number;
  choreographers: number;
  partnerChoreographers: number;
  admins: number;
  totalArtists: number;
  totalInquiries: number;
  pendingApprovals: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  console.log('AdminDashboard component rendered - user:', user, 'loading:', loading);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    choreographers: 0,
    partnerChoreographers: 0,
    admins: 0,
    totalArtists: 0,
    totalInquiries: 0,
    pendingApprovals: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Admin page useEffect - loading:', loading, 'user:', user);
    
    if (!loading && !user) {
      console.log('No user, redirecting to login');
      router.push("/auth/login");
      return;
    }

    if (user && user.role !== 'admin') {
      console.log('User is not admin, redirecting to dashboard. User role:', user.role);
      router.push("/dashboard");
      return;
    }

    if (user) {
      console.log('Admin user detected, fetching dashboard stats');
      fetchDashboardStats();
    }
  }, [user, loading, router]);

  const fetchDashboardStats = async () => {
    try {
      // 사용자 통계
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, pending_role');

      if (!usersError && users) {
        const totalUsers = users.length;
        const choreographers = users.filter((u: any) => u.role === 'choreographer').length;
        const partnerChoreographers = users.filter((u: any) => u.role === 'partner_choreographer').length;
        const admins = users.filter((u: any) => u.role === 'admin').length;
        
        // 승인 대기 중인 사용자 수
        const pendingApprovals = users.filter((u: any) => 
          u.pending_role && u.pending_role !== u.role
        ).length;

        // 아티스트 통계
        const { data: artists, error: artistsError } = await supabase
          .from('artists')
          .select('id');

        // 문의 통계
        const { data: inquiries, error: inquiriesError } = await supabase
          .from('inquiries')
          .select('id');

        setStats({
          totalUsers,
          choreographers,
          partnerChoreographers,
          admins,
          totalArtists: artists?.length || 0,
          totalInquiries: inquiries?.length || 0,
          pendingApprovals
        });
      }
    } catch (error) {
      console.error('대시보드 통계 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <>
        <Header title="관리자 대시보드" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const menuItems = [
    {
      title: "회원 관리",
      description: "사용자 목록 조회 및 권한 설정",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-600 hover:bg-blue-700",
      badge: stats.pendingApprovals > 0 ? `${stats.pendingApprovals}명 승인 대기` : undefined,
      badgeColor: "bg-orange-500"
    },
    {
      title: "아티스트 관리",
      description: "아티스트 등록 및 관리",
      icon: UserCheck,
      href: "/admin/artists",
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "문의 관리",
      description: "고객 문의 내역 확인",
      icon: MessageSquare,
      href: "/admin/inquiries",
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "통계",
      description: "사이트 이용 통계 확인",
      icon: BarChart3,
      href: "/admin/stats",
      color: "bg-orange-600 hover:bg-orange-700"
    }
  ];

  return (
    <>
      <Header title="관리자 대시보드" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">관리자 대시보드</h1>
            <p className="text-white/60">시스템 전체 현황을 한눈에 확인할 수 있습니다.</p>
          </div>

          {/* 승인 대기 알림 */}
          {stats.pendingApprovals > 0 && (
            <div className="mb-8 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-400 mr-3" />
                <div>
                  <h3 className="font-semibold text-orange-400">승인 대기 중인 사용자가 있습니다</h3>
                  <p className="text-white/80 text-sm">
                    {stats.pendingApprovals}명의 사용자가 권한 승인을 기다리고 있습니다.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/admin/users?filter=pending')}
                  className="ml-auto px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  승인 관리
                </button>
              </div>
            </div>
          )}

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">전체 사용자</p>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">전속안무가</p>
                  <p className="text-3xl font-bold text-white">{stats.choreographers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">파트너안무가</p>
                  <p className="text-3xl font-bold text-white">{stats.partnerChoreographers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">총 문의</p>
                  <p className="text-3xl font-bold text-white">{stats.totalInquiries}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* 메뉴 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item) => (
              <div
                key={item.title}
                className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => router.push(item.href)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.badgeColor} text-white`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 