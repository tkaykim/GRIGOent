"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabase";
import Header from "../../../components/Header";

// 사용자 타입 정의
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 경력 타입 정의
interface Career {
  id: string;
  artist_id: string;
  type: string;
  title: string;
  detail?: string;
  country?: string;
  video_url?: string;
  created_at: string;
}

// 아티스트 타입 (사용자 + 아티스트 정보 + 경력)
interface Artist {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  artist_id?: string;
  profile_image?: string;
  artist_type?: string;
  bio?: string;
  youtube_links?: string[];
  name_ko?: string;
  name_en?: string;
  name_ja?: string;
  name_zh?: string;
  careers?: Career[];
}

const CAREER_TYPES = [
  { value: "choreo", label: "안무제작" },
  { value: "broadcast", label: "방송출연" },
  { value: "event", label: "행사출연" },
  { value: "ad", label: "광고출연" },
  { value: "dancer", label: "댄서참여" },
  { value: "workshop", label: "워크샵" },
];

export default function AdminArtistRegisterPage() {
  // 아티스트 목록 상태
  const [artists, setArtists] = useState<Artist[]>([]);
  const [fetching, setFetching] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [editCareers, setEditCareers] = useState<Career[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // 모달 상태
  const [careerModal, setCareerModal] = useState<{type: string, careers: Career[]} | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  // 아티스트 목록 불러오기 (artist_list 뷰 사용)
  const fetchArtists = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("artist_list")
      .select(`
        user_id,
        email,
        name,
        role,
        phone,
        is_active,
        created_at,
        updated_at,
        artist_id,
        profile_image,
        artist_type,
        bio,
        youtube_links,
        name_ko,
        name_en,
        name_ja,
        name_zh,
        career_count
      `)
      .in('role', ['choreographer', 'partner_choreographer'])
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error('Error fetching artists:', error);
      setMessage(`아티스트 목록 조회 실패: ${error.message}`);
    } else {
      // artist_list 데이터를 Artist 타입으로 변환
      const artistsData = data?.map(item => ({
        id: item.user_id,
        email: item.email,
        name: item.name,
        role: item.role,
        phone: item.phone,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        artist_id: item.artist_id,
        profile_image: item.profile_image,
        artist_type: item.artist_type,
        bio: item.bio,
        youtube_links: item.youtube_links,
        name_ko: item.name_ko,
        name_en: item.name_en,
        name_ja: item.name_ja,
        name_zh: item.name_zh,
        careers: [] // 경력은 별도로 로드
      })) || [];
      
      setArtists(artistsData);
    }
    setFetching(false);
  };

  useEffect(() => { fetchArtists(); }, []);

  // 역할에 따른 표시 텍스트
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'choreographer':
        return '전속안무가';
      case 'partner_choreographer':
        return '파트너댄서';
      default:
        return role;
    }
  };

  // 아티스트 수정 모드 진입 시 경력사항도 세팅
  const startEdit = async (artist: Artist) => {
    setEditId(artist.id);
    setEditData({
      name: artist.name || "",
      email: artist.email || "",
      phone: artist.phone || "",
      role: artist.role || "",
    });
    
    // 아티스트의 경력 로드
    if (artist.artist_id) {
      const { data: careers, error } = await supabase
        .from("artists_careers")
        .select("*")
        .eq("artist_id", artist.artist_id);
      
      if (!error && careers) {
        setEditCareers(careers);
      } else {
        setEditCareers([]);
      }
    } else {
      setEditCareers([]);
    }
  };

  // 경력사항 개별 삭제
  const handleCareerDelete = async (careerId: string) => {
    if (!confirm("정말 이 경력을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("artists_careers").delete().eq("id", careerId);
    if (!error) {
      setEditCareers(editCareers.filter(c => c.id !== careerId));
      fetchArtists();
      setMessage("경력이 삭제되었습니다.");
    } else {
      setMessage(`경력 삭제 실패: ${error.message}`);
    }
  };

  // 수정 핸들러
  const handleEditSave = async (id: string) => {
    const { error } = await supabase.from("users").update({
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
      role: editData.role,
    }).eq("id", id);
    
    if (error) {
      setMessage(`수정 실패: ${error.message}`);
    } else {
      setMessage("수정되었습니다.");
      fetchArtists();
      cancelEdit();
    }
  };

  // 수정 취소
  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
    setEditCareers([]);
  };

  // 사용자 활성화/비활성화 토글
  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("users")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    
    if (error) {
      setMessage(`상태 변경 실패: ${error.message}`);
    } else {
      setMessage(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
      fetchArtists();
    }
  };

  // 경력 추가
  const addCareer = async (artistId: string) => {
    const newCareer = {
      artist_id: artistId,
      type: "choreo",
      title: "",
      detail: "",
      country: "",
      video_url: ""
    };
    
    const { data, error } = await supabase
      .from("artists_careers")
      .insert([newCareer])
      .select()
      .single();
    
    if (error) {
      setMessage(`경력 추가 실패: ${error.message}`);
    } else {
      setEditCareers([...editCareers, data]);
      fetchArtists();
      setMessage("경력이 추가되었습니다.");
    }
  };

  // 경력 수정
  const updateCareer = async (careerId: string, field: string, value: string) => {
    const { error } = await supabase
      .from("artists_careers")
      .update({ [field]: value })
      .eq("id", careerId);
    
    if (error) {
      setMessage(`경력 수정 실패: ${error.message}`);
    } else {
      setEditCareers(editCareers.map(c => 
        c.id === careerId ? { ...c, [field]: value } : c
      ));
      fetchArtists();
    }
  };

  return (
    <>
      <Header title="댄서 관리" />
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">댄서 관리 (관리자)</h1>
        
        {message && (
          <div className={`p-4 mb-4 rounded ${message.includes('실패') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {fetching ? (
          <div className="text-center text-gray-400">로딩 중...</div>
        ) : (
          <div className="space-y-6">
            {artists.map((artist) => (
              <div key={artist.id} className="bg-white rounded-lg shadow-md p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{artist.name || "이름 없음"}</h3>
                    <p className="text-gray-600">{artist.email}</p>
                    <p className="text-sm text-gray-500">{getRoleDisplay(artist.role)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${artist.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {artist.is_active ? '활성' : '비활성'}
                    </span>
                    <button
                      onClick={() => toggleUserStatus(artist.id, artist.is_active)}
                      className={`px-3 py-1 rounded text-sm ${artist.is_active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                    >
                      {artist.is_active ? '비활성화' : '활성화'}
                    </button>
                    {editId === artist.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(artist.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(artist)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                      >
                        수정
                      </button>
                    )}
                  </div>
                </div>

                {editId === artist.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">이름</label>
                      <input
                        type="text"
                        value={editData.name as string}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">이메일</label>
                      <input
                        type="email"
                        value={editData.email as string}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">전화번호</label>
                      <input
                        type="text"
                        value={editData.phone as string}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">역할</label>
                      <select
                        value={editData.role as string}
                        onChange={(e) => setEditData({...editData, role: e.target.value})}
                        className="w-full border px-3 py-2 rounded"
                      >
                        <option value="choreographer">전속안무가</option>
                        <option value="partner_choreographer">파트너댄서</option>
                      </select>
                    </div>

                    {/* 경력 관리 */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">경력 관리</h4>
                        <button
                          onClick={() => addCareer(artist.artist_id || '')}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                          disabled={!artist.artist_id}
                        >
                          경력 추가
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {editCareers.map((career) => (
                          <div key={career.id} className="border rounded p-3 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium mb-1">타입</label>
                                <select
                                  value={career.type}
                                  onChange={(e) => updateCareer(career.id, 'type', e.target.value)}
                                  className="w-full border px-2 py-1 rounded text-sm"
                                >
                                  {CAREER_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">제목</label>
                                <input
                                  type="text"
                                  value={career.title}
                                  onChange={(e) => updateCareer(career.id, 'title', e.target.value)}
                                  className="w-full border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">상세</label>
                                <input
                                  type="text"
                                  value={career.detail || ''}
                                  onChange={(e) => updateCareer(career.id, 'detail', e.target.value)}
                                  className="w-full border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">국가</label>
                                <input
                                  type="text"
                                  value={career.country || ''}
                                  onChange={(e) => updateCareer(career.id, 'country', e.target.value)}
                                  className="w-full border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium mb-1">비디오 URL</label>
                                <input
                                  type="text"
                                  value={career.video_url || ''}
                                  onChange={(e) => updateCareer(career.id, 'video_url', e.target.value)}
                                  className="w-full border px-2 py-1 rounded text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => handleCareerDelete(career.id)}
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      가입일: {new Date(artist.created_at).toLocaleDateString()}
                    </div>
                    {artist.artist_id && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">아티스트 정보</h4>
                        <div className="text-sm text-gray-600">
                          <p>아티스트 ID: {artist.artist_id}</p>
                          <p>아티스트 타입: {artist.artist_type || '미설정'}</p>
                          {artist.bio && <p>소개: {artist.bio}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 