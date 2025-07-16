'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Header from '../../../components/Header';
import { Search, Edit, Save, X, UserCheck, UserX, Shield, Mail, Phone, Calendar } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ROLE_OPTIONS = [
  { value: 'client', label: '일반 클라이언트' },
  { value: 'choreographer', label: '전속안무가' },
  { value: 'partner_choreographer', label: '파트너안무가' },
  { value: 'admin', label: '관리자' }
];

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
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
      fetchUsers();
    }
  }, [user, loading, router]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('사용자 목록 조회 오류:', error);
        setMessage('사용자 목록을 불러오는데 실패했습니다.');
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      setMessage('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 역할 필터링
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const startEdit = (user: User) => {
    setEditingUser(user.id);
    setEditData({
      name: user.name,
      role: user.role,
      phone: user.phone,
      is_active: user.is_active
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditData({});
  };

  const saveEdit = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editData.name,
          role: editData.role,
          phone: editData.phone,
          is_active: editData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        setMessage(`사용자 정보 수정 실패: ${error.message}`);
      } else {
        setMessage('사용자 정보가 수정되었습니다.');
        fetchUsers();
        cancelEdit();
      }
    } catch (error) {
      setMessage('사용자 정보 수정 중 오류가 발생했습니다.');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        setMessage(`사용자 상태 변경 실패: ${error.message}`);
      } else {
        setMessage(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
        fetchUsers();
      }
    } catch (error) {
      setMessage('사용자 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getRoleLabel = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(option => option.value === role);
    return roleOption ? roleOption.label : role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600 text-white';
      case 'choreographer':
        return 'bg-green-600 text-white';
      case 'partner_choreographer':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  if (loading || isLoading) {
    return (
      <>
        <Header title="회원 관리" />
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
      <Header title="회원 관리" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">회원 관리</h1>
            <p className="text-white/60">사용자 목록을 조회하고 권한을 설정할 수 있습니다.</p>
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
                  placeholder="이름, 이메일, 전화번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/60"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded text-white"
              >
                <option value="all">모든 역할</option>
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="text-white/60 text-sm flex items-center">
                총 {filteredUsers.length}명의 사용자
              </div>
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">사용자 정보</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">역할</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">상태</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">가입일</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center mb-1">
                            <Shield className="w-4 h-4 mr-2 text-white/60" />
                            <span className="font-semibold">{user.name || '이름 없음'}</span>
                          </div>
                          <div className="flex items-center text-sm text-white/60 mb-1">
                            <Mail className="w-4 h-4 mr-2" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-white/60">
                              <Phone className="w-4 h-4 mr-2" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {user.is_active ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              활성
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              비활성
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdit(user.id)}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              저장
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={`flex items-center px-3 py-1 rounded text-sm ${
                                user.is_active 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="w-4 h-4 mr-1" />
                                  비활성화
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  활성화
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 편집 모달 */}
            {editingUser && (
              <div className="p-6 border-t border-white/10">
                <h3 className="text-lg font-semibold mb-4">사용자 정보 수정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">이름</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">역할</label>
                    <select
                      value={editData.role || ''}
                      onChange={(e) => setEditData({...editData, role: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    >
                      {ROLE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">전화번호</label>
                    <input
                      type="text"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">상태</label>
                    <select
                      value={editData.is_active ? 'true' : 'false'}
                      onChange={(e) => setEditData({...editData, is_active: e.target.value === 'true'})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    >
                      <option value="true">활성</option>
                      <option value="false">비활성</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 