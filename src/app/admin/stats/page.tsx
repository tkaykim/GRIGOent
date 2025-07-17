'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase';
import Header from '../../../components/Header';
import { Users, UserCheck, UserPlus, Settings, BarChart3, FileText, MessageSquare, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface Stats {
  totalUsers: number;
  choreographers: number;
  partnerChoreographers: number;
  admins: number;
  totalArtists: number;
  totalInquiries: number;
  monthlyUsers: { month: string; count: number }[];
  monthlyInquiries: { month: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
  inquiryTypeDistribution: { type: string; count: number }[];
}

export default function AdminStatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    choreographers: 0,
    partnerChoreographers: 0,
    admins: 0,
    totalArtists: 0,
    totalInquiries: 0,
    monthlyUsers: [],
    monthlyInquiries: [],
    roleDistribution: [],
    inquiryTypeDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

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
      fetchStats();
    }
  }, [user, loading, router, selectedPeriod]);

  const fetchStats = async () => {
    try {
      // 기본 통계
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, created_at');

      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('id');

      const { data: inquiries, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('type, created_at');

      if (!usersError && users) {
        const totalUsers = users.length;
        const choreographers = users.filter(u => u.role === 'choreographer').length;
        const partnerChoreographers = users.filter(u => u.role === 'partner_choreographer').length;
        const admins = users.filter(u => u.role === 'admin').length;

        // 역할별 분포
        const roleDistribution = [
          { role: '일반 클라이언트', count: users.filter(u => u.role === 'client').length },
          { role: '전속안무가', count: choreographers },
          { role: '파트너안무가', count: partnerChoreographers },
          { role: '관리자', count: admins }
        ];

        // 월별 사용자 가입 통계
        const monthlyUsers = getMonthlyStats(users, 'created_at', selectedPeriod);

        // 문의 타입별 분포
        const inquiryTypeDistribution = getInquiryTypeDistribution(inquiries || []);

        // 월별 문의 통계
        const monthlyInquiries = getMonthlyStats(inquiries || [], 'created_at', selectedPeriod);

        setStats({
          totalUsers,
          choreographers,
          partnerChoreographers,
          admins,
          totalArtists: artists?.length || 0,
          totalInquiries: inquiries?.length || 0,
          monthlyUsers,
          monthlyInquiries,
          roleDistribution,
          inquiryTypeDistribution
        });
      }
    } catch (error) {
      console.error('통계 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthlyStats = (data: any[], dateField: string, period: string) => {
    const months = [];
    const now = new Date();
    let monthsBack = 6;

    if (period === '3months') monthsBack = 3;
    else if (period === '12months') monthsBack = 12;

    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
      
      const count = data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate.getFullYear() === date.getFullYear() && 
               itemDate.getMonth() === date.getMonth();
      }).length;

      months.push({ month: monthLabel, count });
    }

    return months;
  };

  const getInquiryTypeDistribution = (inquiries: any[]) => {
    const typeCounts: Record<string, number> = {};
    
    inquiries.forEach(inquiry => {
      const type = inquiry.type || '기타';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case '일반 클라이언트':
        return 'bg-gray-600';
      case '전속안무가':
        return 'bg-green-600';
      case '파트너안무가':
        return 'bg-purple-600';
      case '관리자':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getInquiryTypeColor = (type: string) => {
    switch (type) {
      case '안무제작':
        return 'bg-blue-600';
      case '댄서섭외':
        return 'bg-green-600';
      case '공연출연':
        return 'bg-purple-600';
      case '워크샵':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading || isLoading) {
    return (
      <>
        <Header title="통계" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header title="통계" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">사이트 통계</h1>
            <p className="text-white/60">사이트 이용 현황과 통계를 확인할 수 있습니다.</p>
          </div>

          {/* 기간 선택 */}
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">통계 기간</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedPeriod('3months')}
                  className={`px-4 py-2 rounded ${selectedPeriod === '3months' ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  3개월
                </button>
                <button
                  onClick={() => setSelectedPeriod('6months')}
                  className={`px-4 py-2 rounded ${selectedPeriod === '6months' ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  6개월
                </button>
                <button
                  onClick={() => setSelectedPeriod('12months')}
                  className={`px-4 py-2 rounded ${selectedPeriod === '12months' ? 'bg-blue-600' : 'bg-white/10'}`}
                >
                  12개월
                </button>
              </div>
            </div>
          </div>

          {/* 기본 통계 카드 */}
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

          {/* 차트 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 역할별 분포 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6">사용자 역할별 분포</h3>
              <div className="space-y-4">
                {stats.roleDistribution.map((item) => (
                  <div key={item.role} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded mr-3 ${getRoleColor(item.role)}`}></div>
                      <span className="text-white/80">{item.role}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{item.count}명</span>
                      <span className="text-white/60 text-sm">
                        ({((item.count / stats.totalUsers) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 문의 타입별 분포 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6">문의 타입별 분포</h3>
              <div className="space-y-4">
                {stats.inquiryTypeDistribution.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded mr-3 ${getInquiryTypeColor(item.type)}`}></div>
                      <span className="text-white/80">{item.type}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{item.count}건</span>
                      <span className="text-white/60 text-sm">
                        ({((item.count / stats.totalInquiries) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 월별 사용자 가입 통계 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6">월별 사용자 가입 현황</h3>
              <div className="space-y-4">
                {stats.monthlyUsers.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-white/80">{item.month}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-white/10 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.count / Math.max(...stats.monthlyUsers.map(m => m.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-sm">{item.count}명</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 월별 문의 통계 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6">월별 문의 현황</h3>
              <div className="space-y-4">
                {stats.monthlyInquiries.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-white/80">{item.month}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-white/10 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(item.count / Math.max(...stats.monthlyInquiries.map(m => m.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-sm">{item.count}건</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 