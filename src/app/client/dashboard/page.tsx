"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import Header from "../../../components/Header";
import { supabase } from "../../../utils/supabase";
import { 
  User, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Eye
} from "lucide-react";

interface ClientInquiry {
  id: string;
  project_name: string;
  project_type: string;
  description: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  created_at: string;
  artist: {
    name_ko: string;
    name_en: string;
    profile_image: string;
  };
}

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<ClientInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInquiries: 0,
    pendingInquiries: 0,
    acceptedInquiries: 0,
    completedInquiries: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user && user.role !== 'client') {
      router.push("/dashboard");
      return;
    }

    if (user) {
      fetchClientData();
    }
  }, [user, loading, router]);

  const fetchClientData = async () => {
    if (!user) return;

    try {
      // 클라이언트 문의 조회
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from('client_inquiries')
        .select(`
          *,
          artist:artists(name_ko, name_en, profile_image)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (inquiriesError) {
        console.error('문의 조회 오류:', inquiriesError);
      } else {
        setInquiries(inquiriesData || []);
        
        // 통계 계산
        const total = inquiriesData?.length || 0;
        const pending = inquiriesData?.filter(i => i.status === 'pending').length || 0;
        const accepted = inquiriesData?.filter(i => i.status === 'accepted').length || 0;
        const completed = inquiriesData?.filter(i => i.status === 'completed').length || 0;
        
        setStats({
          totalInquiries: total,
          pendingInquiries: pending,
          acceptedInquiries: accepted,
          completedInquiries: completed
        });
      }
    } catch (error) {
      console.error('클라이언트 데이터 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'accepted':
        return 'bg-green-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '검토 중';
      case 'accepted':
        return '승인됨';
      case 'rejected':
        return '거절됨';
      case 'completed':
        return '완료';
      default:
        return status;
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'choreography':
        return '안무제작';
      case 'performance':
        return '공연출연';
      case 'workshop':
        return '워크샵';
      case 'other':
        return '기타';
      default:
        return type;
    }
  };

  const formatBudget = (min: number, max: number, currency: string) => {
    if (!min && !max) return '협의';
    if (min === max) return `${min.toLocaleString()} ${currency}`;
    return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
  };

  if (loading || isLoading) {
    return (
      <>
        <Header title="클라이언트 대시보드" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!user || user.role !== 'client') {
    return null;
  }

  return (
    <>
      <Header title="클라이언트 대시보드" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">클라이언트 대시보드</h1>
            <p className="text-white/60">안녕하세요, {user.name || user.email}님! 프로젝트 현황을 확인하세요.</p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">총 문의</p>
                  <p className="text-3xl font-bold text-white">{stats.totalInquiries}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">검토 중</p>
                  <p className="text-3xl font-bold text-white">{stats.pendingInquiries}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">승인됨</p>
                  <p className="text-3xl font-bold text-white">{stats.acceptedInquiries}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">완료</p>
                  <p className="text-3xl font-bold text-white">{stats.completedInquiries}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="mb-8 flex gap-4">
            <button
              onClick={() => router.push("/artists")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              아티스트 찾기
            </button>
            <button
              onClick={() => router.push("/contact")}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 문의하기
            </button>
          </div>

          {/* 문의 목록 */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-6">내 문의 내역</h2>
            
            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-lg mb-4">아직 문의한 내역이 없습니다.</p>
                <button
                  onClick={() => router.push("/artists")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  아티스트 찾아보기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {inquiry.artist?.profile_image ? (
                          <img
                            src={inquiry.artist.profile_image}
                            alt={inquiry.artist.name_ko}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold">{inquiry.project_name}</h3>
                          <p className="text-white/60">
                            {inquiry.artist?.name_ko || inquiry.artist?.name_en || '알 수 없음'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(inquiry.status)}`}>
                        {getStatusLabel(inquiry.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">프로젝트 타입:</span>
                        <p className="text-white font-medium">{getProjectTypeLabel(inquiry.project_type)}</p>
                      </div>
                      <div>
                        <span className="text-white/60">예산:</span>
                        <p className="text-white font-medium">
                          {formatBudget(inquiry.budget_min, inquiry.budget_max, inquiry.currency)}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/60">기간:</span>
                        <p className="text-white font-medium">
                          {inquiry.start_date && inquiry.end_date ? 
                            `${inquiry.start_date} ~ ${inquiry.end_date}` : 
                            '협의'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-white/60">위치:</span>
                        <p className="text-white font-medium">{inquiry.location || '협의'}</p>
                      </div>
                    </div>
                    
                    {inquiry.description && (
                      <div className="mt-4">
                        <span className="text-white/60 text-sm">설명:</span>
                        <p className="text-white/80 mt-1">{inquiry.description}</p>
                      </div>
                    )}
                    
                    <div className="mt-4 text-xs text-white/40">
                      문의일: {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 