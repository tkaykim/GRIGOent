'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Header from '../../../components/Header';
import { Search, Eye, Calendar, Mail, Phone, MapPin, DollarSign, Clock } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Inquiry {
  id: string;
  artist_name: string;
  manager_name: string;
  start_date: string;
  end_date: string;
  approximate_date: string;
  type: string;
  place: string;
  budget: number;
  currency: string;
  budget_undecided: boolean;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

export default function AdminInquiriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      fetchInquiries();
    }
  }, [user, loading, router]);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, typeFilter]);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('문의 목록 조회 오류:', error);
        setMessage('문의 목록을 불러오는데 실패했습니다.');
      } else {
        setInquiries(data || []);
      }
    } catch (error) {
      console.error('문의 목록 조회 오류:', error);
      setMessage('문의 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInquiries = () => {
    let filtered = inquiries;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(inquiry =>
        inquiry.artist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 타입 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.type === typeFilter);
    }

    setFilteredInquiries(filtered);
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      '안무제작': '안무제작',
      '댄서섭외': '댄서섭외',
      '공연출연': '공연출연',
      '워크샵': '워크샵',
      '기타': '기타'
    };
    return typeLabels[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '안무제작':
        return 'bg-blue-600 text-white';
      case '댄서섭외':
        return 'bg-green-600 text-white';
      case '공연출연':
        return 'bg-purple-600 text-white';
      case '워크샵':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (budget: number, currency: string, undecided: boolean) => {
    if (undecided) return '미정';
    if (!budget) return '-';
    return `${budget.toLocaleString()} ${currency}`;
  };

  if (loading || isLoading) {
    return (
      <>
        <Header title="문의 관리" />
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
      <Header title="문의 관리" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">문의 관리</h1>
            <p className="text-white/60">고객 문의 내역을 확인하고 관리할 수 있습니다.</p>
          </div>

          {/* 메시지 */}
          {message && (
            <div className="mb-6 p-4 bg-white/10 rounded-lg">
              <p className="text-white">{message}</p>
            </div>
          )}

          {/* 검색 및 필터 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="아티스트명, 담당자명, 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/60"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded text-white"
              >
                <option value="all">모든 타입</option>
                <option value="안무제작">안무제작</option>
                <option value="댄서섭외">댄서섭외</option>
                <option value="공연출연">공연출연</option>
                <option value="워크샵">워크샵</option>
                <option value="기타">기타</option>
              </select>
              <div className="text-white/60 text-sm flex items-center">
                총 {filteredInquiries.length}개의 문의
              </div>
            </div>
          </div>

          {/* 문의 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(inquiry.type)}`}>
                    {getTypeLabel(inquiry.type)}
                  </span>
                  <span className="text-white/60 text-sm">
                    {formatDate(inquiry.created_at)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{inquiry.artist_name}</h3>
                    <p className="text-white/60 text-sm">담당자: {inquiry.manager_name}</p>
                  </div>

                  <div className="space-y-2">
                    {inquiry.email && (
                      <div className="flex items-center text-sm text-white/80">
                        <Mail className="w-4 h-4 mr-2 text-white/60" />
                        {inquiry.email}
                      </div>
                    )}
                    {inquiry.phone && (
                      <div className="flex items-center text-sm text-white/80">
                        <Phone className="w-4 h-4 mr-2 text-white/60" />
                        {inquiry.phone}
                      </div>
                    )}
                    {inquiry.place && (
                      <div className="flex items-center text-sm text-white/80">
                        <MapPin className="w-4 h-4 mr-2 text-white/60" />
                        {inquiry.place}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-white/80">
                      <DollarSign className="w-4 h-4 mr-2 text-white/60" />
                      {formatBudget(inquiry.budget, inquiry.currency, inquiry.budget_undecided)}
                    </div>
                    {(inquiry.start_date || inquiry.end_date || inquiry.approximate_date) && (
                      <div className="flex items-center text-sm text-white/80">
                        <Calendar className="w-4 h-4 mr-2 text-white/60" />
                        {inquiry.start_date && inquiry.end_date 
                          ? `${inquiry.start_date} ~ ${inquiry.end_date}`
                          : inquiry.approximate_date || '날짜 미정'
                        }
                      </div>
                    )}
                  </div>

                  {inquiry.message && (
                    <div className="mt-4">
                      <p className="text-white/80 text-sm line-clamp-3">
                        {inquiry.message}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedInquiry(inquiry)}
                    className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 상세 모달 */}
          {selectedInquiry && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">문의 상세</h2>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">아티스트명</label>
                      <p className="text-white">{selectedInquiry.artist_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">담당자명</label>
                      <p className="text-white">{selectedInquiry.manager_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">이메일</label>
                      <p className="text-white">{selectedInquiry.email || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">전화번호</label>
                      <p className="text-white">{selectedInquiry.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">문의 타입</label>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(selectedInquiry.type)}`}>
                        {getTypeLabel(selectedInquiry.type)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">장소</label>
                      <p className="text-white">{selectedInquiry.place || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">예산</label>
                      <p className="text-white">
                        {formatBudget(selectedInquiry.budget, selectedInquiry.currency, selectedInquiry.budget_undecided)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">일정</label>
                      <p className="text-white">
                        {selectedInquiry.start_date && selectedInquiry.end_date 
                          ? `${selectedInquiry.start_date} ~ ${selectedInquiry.end_date}`
                          : selectedInquiry.approximate_date || '날짜 미정'
                        }
                      </p>
                    </div>
                  </div>

                  {selectedInquiry.message && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">문의 내용</label>
                      <div className="bg-white/5 rounded p-4">
                        <p className="text-white whitespace-pre-wrap">{selectedInquiry.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-white/60 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    문의 접수: {formatDate(selectedInquiry.created_at)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 