"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import Header from "../../../components/Header";
import { Search, Edit, Save, X, Check, UserCheck, Clock } from "lucide-react";
import { supabase } from "../../../utils/supabase";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  pending_role: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ROLE_OPTIONS = [
  { value: 'general', label: '일반회원' },
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
  const [pendingFilter, setPendingFilter] = useState('all');
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
  }, [users, searchTerm, roleFilter, pendingFilter]);

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
        setUsers((data as unknown as User[]) || []);
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

    // 승인 대기 필터링
    if (pendingFilter === 'pending') {
      filtered = filtered.filter(user => user.pending_role && user.pending_role !== user.role);
    } else if (pendingFilter === 'approved') {
      filtered = filtered.filter(user => !user.pending_role || user.pending_role === user.role);
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
          is_active: editData.is_active
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

  const approvePendingRole = async (userId: string, pendingRole: string) => {
    try {
      console.log('승인 시작:', { userId, pendingRole });
      
      // 승인 전 사용자 상태 확인
      const { data: beforeData, error: beforeError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (beforeError) {
        console.error('승인 전 사용자 조회 오류:', beforeError);
        setMessage(`승인 실패: 사용자 정보를 찾을 수 없습니다.`);
        return;
      }
      
      console.log('승인 전 사용자 상태:', beforeData);
      
      // 사용자 역할 업데이트 (트리거가 자동으로 아티스트 프로필 생성)
      const { data: updateData, error: userError } = await supabase
        .from('users')
        .update({
          role: pendingRole,
          pending_role: null // 승인 후 pending_role 초기화
        })
        .eq('id', userId)
        .select();

      if (userError) {
        console.error('승인 오류:', userError);
        setMessage(`승인 실패: ${userError.message}`);
        return;
      }

      console.log('승인 성공:', updateData);

      // 승인 후 사용자 상태 재확인
      const { data: afterData, error: afterError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (afterError) {
        console.error('승인 후 사용자 조회 오류:', afterError);
      } else {
        console.log('승인 후 사용자 상태:', afterData);
        
        // 실제 변경 확인
        if (afterData.role === pendingRole && afterData.pending_role === null) {
          console.log('✅ 권한 변경이 성공적으로 반영되었습니다.');
        } else {
          console.error('❌ 권한 변경이 반영되지 않았습니다.');
          console.log('예상:', { role: pendingRole, pending_role: null });
          console.log('실제:', { role: afterData.role, pending_role: afterData.pending_role });
        }
      }

      // 아티스트 프로필 생성 확인 (트리거가 자동으로 처리)
      if (pendingRole === 'choreographer' || pendingRole === 'partner_choreographer') {
        // 트리거 실행을 위한 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('user_id', userId);

        if (artistError) {
          console.error('아티스트 프로필 확인 오류:', artistError);
        } else if (artistData && artistData.length > 0) {
          console.log('아티스트 프로필 자동 생성 확인:', artistData[0]);
        } else {
          console.warn('아티스트 프로필이 자동으로 생성되지 않았습니다. 트리거를 확인해주세요.');
        }
      }

      setMessage('사용자 권한이 승인되었습니다.');
      fetchUsers();
    } catch (error) {
      console.error('승인 중 예외:', error);
      setMessage('승인 중 오류가 발생했습니다.');
    }
  };

  const rejectPendingRole = async (userId: string) => {
    try {
      console.log('거부 시작:', { userId });
      
      // 거부 전 사용자 상태 확인
      const { data: beforeData, error: beforeError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (beforeError) {
        console.error('거부 전 사용자 조회 오류:', beforeError);
        setMessage(`거부 실패: 사용자 정보를 찾을 수 없습니다.`);
        return;
      }
      
      console.log('거부 전 사용자 상태:', beforeData);
      
      const { data: updateData, error } = await supabase
        .from('users')
        .update({
          pending_role: null // pending_role만 초기화
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('거부 오류:', error);
        setMessage(`거부 실패: ${error.message}`);
        return;
      }

      console.log('거부 성공:', updateData);

      // 거부 후 사용자 상태 재확인
      const { data: afterData, error: afterError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (afterError) {
        console.error('거부 후 사용자 조회 오류:', afterError);
      } else {
        console.log('거부 후 사용자 상태:', afterData);
        
        // 실제 변경 확인
        if (afterData.pending_role === null) {
          console.log('✅ 거부가 성공적으로 반영되었습니다.');
        } else {
          console.error('❌ 거부가 반영되지 않았습니다.');
          console.log('예상:', { pending_role: null });
          console.log('실제:', { pending_role: afterData.pending_role });
        }
      }

      setMessage('승인 요청이 거부되었습니다.');
      fetchUsers();
    } catch (error) {
      console.error('거부 중 예외:', error);
      setMessage('거부 중 오류가 발생했습니다.');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: !currentStatus
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
      case 'client':
        return 'bg-blue-600 text-white';
      case 'general':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getPendingRoleColor = (pendingRole: string) => {
    switch (pendingRole) {
      case 'choreographer':
        return 'bg-green-500 text-white';
      case 'partner_choreographer':
        return 'bg-purple-500 text-white';
      case 'client':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
            <p className="text-white/60">사용자 목록을 조회하고 권한을 관리할 수 있습니다.</p>
          </div>

          {/* 메시지 */}
          {message && (
            <div className="mb-6 p-4 bg-white/10 rounded-lg">
              <p className="text-white">{message}</p>
            </div>
          )}

          {/* 검색 및 필터 */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">모든 역할</option>
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={pendingFilter}
              onChange={(e) => setPendingFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">모든 상태</option>
              <option value="pending">승인 대기</option>
              <option value="approved">승인 완료</option>
            </select>
            <div className="text-white/60 text-sm flex items-center">
              총 {filteredUsers.length}명
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="bg-white/5 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">현재 역할</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">승인 대기</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">가입일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{user.name || '이름 없음'}</div>
                          <div className="text-sm text-white/60">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-white/60">{user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.pending_role && user.pending_role !== user.role ? (
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPendingRoleColor(user.pending_role)}`}>
                              {getRoleLabel(user.pending_role)}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => approvePendingRole(user.id, user.pending_role!)}
                                className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
                                title="승인"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => rejectPendingRole(user.id)}
                                className="p-1 bg-red-600 hover:bg-red-700 rounded text-white"
                                title="거부"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm">대기 없음</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {user.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingUser === user.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEdit(user.id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={`${user.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                            >
                              {user.is_active ? '비활성화' : '활성화'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 편집 모달 */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">사용자 정보 수정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">이름</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">역할</label>
                    <select
                      value={editData.role || ''}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    >
                      {ROLE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">전화번호</label>
                    <input
                      type="text"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editData.is_active || false}
                      onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm">활성 상태</label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => saveEdit(editingUser)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 