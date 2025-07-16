'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Header from '../../components/Header';
import { Users, UserCheck, UserX, UserPlus, Settings, BarChart3, FileText, MessageSquare } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardStats {
  totalUsers: number;
  choreographers: number;
  partnerChoreographers: number;
  admins: number;
  totalArtists: number;
  totalInquiries: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    choreographers: 0,
    partnerChoreographers: 0,
    admins: 0,
    totalArtists: 0,
    totalInquiries: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user && user.role !== 'admin') {
      router.push("/dashboard");
      return;
    }

    if (user) {
      fetchDashboardStats();
    }
  }, [user, loading, router]);

  const fetchDashboardStats = async () => {
    try {
      // 사용자 통계
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role');

      if (!usersError && users) {
        const totalUsers = users.length;
        const choreographers = users.filter(u => u.role === 'choreographer').length;
        const partnerChoreographers = users.filter(u => u.role === 'partner_choreographer').length;
        const admins = users.filter(u => u.role === 'admin').length;

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
          totalInquiries: inquiries?.length || 0
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
      color: "bg-blue-600 hover:bg-blue-700"
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
            <p className="text-white/60">안녕하세요, {user.name || user.email}님!</p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">전체 사용자</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">전속안무가</p>
                  <p className="text-3xl font-bold">{stats.choreographers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">파트너안무가</p>
                  <p className="text-3xl font-bold">{stats.partnerChoreographers}</p>
                </div>
                <UserPlus className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">전체 아티스트</p>
                  <p className="text-3xl font-bold">{stats.totalArtists}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">전체 문의</p>
                  <p className="text-3xl font-bold">{stats.totalInquiries}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">관리자</p>
                  <p className="text-3xl font-bold">{stats.admins}</p>
                </div>
                <Settings className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* 메뉴 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${item.color} mr-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                  </div>
                  <p className="text-white/60">{item.description}</p>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
} 