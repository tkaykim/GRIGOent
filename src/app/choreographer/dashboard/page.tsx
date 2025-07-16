'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { createClient } from "@supabase/supabase-js";
import Header from '../../../components/Header';
import { Camera, Edit, Save, X, Plus, Trash2 } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface ArtistProfile {
  id: string;
  user_id: string;
  name_ko: string;
  name_en?: string;
  profile_image?: string;
  bio?: string;
  youtube_links?: string[];
  artist_type: string;
  created_at: string;
  updated_at: string;
}

interface ArtistCareer {
  id: string;
  artist_id: string;
  type: string;
  title: string;
  detail?: string;
  country?: string;
  video_url?: string;
  created_at: string;
}

const CAREER_TYPES = [
  { value: "choreo", label: "안무제작" },
  { value: "broadcast", label: "방송출연" },
  { value: "event", label: "행사출연" },
  { value: "ad", label: "광고출연" },
  { value: "dancer", label: "댄서참여" },
  { value: "workshop", label: "워크샵" },
];

export default function ChoreographerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [careers, setCareers] = useState<ArtistCareer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // 프로필 편집 상태
  const [editProfile, setEditProfile] = useState({
    name_ko: '',
    name_en: '',
    bio: '',
    youtube_links: '',
  });

  // 경력 편집 상태
  const [editCareers, setEditCareers] = useState<Omit<ArtistCareer, 'id' | 'artist_id' | 'created_at'>[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user && user.role !== 'choreographer') {
      router.push("/dashboard");
      return;
    }

    if (user) {
      fetchChoreographerData();
    }
  }, [user, loading, router]);

  const fetchChoreographerData = async () => {
    if (!user) return;

    try {
      // 1. artists 테이블에서 전속안무가 프로필 조회
      const { data: profileData, error: profileError } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', user.id)
        .eq('artist_type', 'choreographer')
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      if (profileData) {
        setProfile(profileData);
        setEditProfile({
          name_ko: profileData.name_ko || '',
          name_en: profileData.name_en || '',
          bio: profileData.bio || '',
          youtube_links: Array.isArray(profileData.youtube_links) ? profileData.youtube_links.join('\n') : '',
        });
      }

      // 2. artists_careers 테이블에서 경력 조회
      if (profileData) {
        const { data: careersData, error: careersError } = await supabase
          .from('artists_careers')
          .select('*')
          .eq('artist_id', profileData.id)
          .order('created_at', { ascending: false });

        if (careersError) {
          console.error('Careers fetch error:', careersError);
        } else {
          setCareers(careersData || []);
          setEditCareers(careersData?.map(c => ({
            type: c.type,
            title: c.title,
            detail: c.detail || '',
            country: c.country || '',
            video_url: c.video_url || '',
          })) || []);
        }
      }

    } catch (error) {
      console.error('Error fetching choreographer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;

    try {
      const youtubeLinks = editProfile.youtube_links
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0);

      if (profile) {
        // 기존 프로필 업데이트
        const { error } = await supabase
          .from('artists')
          .update({
            name_ko: editProfile.name_ko,
            name_en: editProfile.name_en || null,
            bio: editProfile.bio || null,
            youtube_links: youtubeLinks,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) {
          setMessage(`프로필 업데이트 실패: ${error.message}`);
          return;
        }
      } else {
        // 새 프로필 생성
        const { data: newProfile, error } = await supabase
          .from('artists')
          .insert({
            user_id: user.id,
            artist_type: 'choreographer',
            name_ko: editProfile.name_ko,
            name_en: editProfile.name_en || null,
            bio: editProfile.bio || null,
            youtube_links: youtubeLinks,
          })
          .select()
          .single();

        if (error) {
          setMessage(`프로필 생성 실패: ${error.message}`);
          return;
        }

        setProfile(newProfile);
      }

      setMessage('프로필이 저장되었습니다.');
      setIsEditing(false);
      fetchChoreographerData();
    } catch (error) {
      setMessage('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const handleCareersSave = async () => {
    if (!profile) return;

    try {
      // 기존 경력 삭제
      const { error: deleteError } = await supabase
        .from('artists_careers')
        .delete()
        .eq('artist_id', profile.id);

      if (deleteError) {
        setMessage(`경력 삭제 실패: ${deleteError.message}`);
        return;
      }

      // 새 경력 추가
      const careersToInsert = editCareers
        .filter(c => c.title.trim() !== '')
        .map(c => ({
          artist_id: profile.id,
          type: c.type,
          title: c.title,
          detail: c.detail || null,
          country: c.country || null,
          video_url: c.video_url || null,
        }));

      if (careersToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('artists_careers')
          .insert(careersToInsert);

        if (insertError) {
          setMessage(`경력 저장 실패: ${insertError.message}`);
          return;
        }
      }

      setMessage('경력이 저장되었습니다.');
      fetchChoreographerData();
    } catch (error) {
      setMessage('경력 저장 중 오류가 발생했습니다.');
    }
  };

  const addCareer = () => {
    setEditCareers([...editCareers, {
      type: 'choreo',
      title: '',
      detail: '',
      country: '',
      video_url: '',
    }]);
  };

  const removeCareer = (index: number) => {
    setEditCareers(editCareers.filter((_, i) => i !== index));
  };

  const updateCareer = (index: number, field: string, value: string) => {
    setEditCareers(editCareers.map((c, i) => 
      i === index ? { ...c, [field]: value } : c
    ));
  };

  if (loading || isLoading) {
    return (
      <>
        <Header title="전속안무가 대시보드" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!user || user.role !== 'choreographer') {
    return null;
  }

  return (
    <>
      <Header title="전속안무가 대시보드" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">전속안무가 대시보드</h1>
            <p className="text-white/60">안녕하세요, {user.name || user.email}님!</p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-white/10 rounded-lg">
              <p className="text-white">{message}</p>
            </div>
          )}

          {/* 프로필 섹션 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">프로필 정보</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded hover:bg-white/90 transition-colors"
              >
                {isEditing ? <X size={16} /> : <Edit size={16} />}
                {isEditing ? '취소' : '편집'}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">한국어 이름 *</label>
                    <input
                      type="text"
                      value={editProfile.name_ko}
                      onChange={(e) => setEditProfile({...editProfile, name_ko: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      placeholder="한국어 이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">영어 이름</label>
                    <input
                      type="text"
                      value={editProfile.name_en}
                      onChange={(e) => setEditProfile({...editProfile, name_en: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      placeholder="영어 이름을 입력하세요"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">소개</label>
                  <textarea
                    value={editProfile.bio}
                    onChange={(e) => setEditProfile({...editProfile, bio: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white min-h-[100px]"
                    placeholder="자신을 소개해주세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">유튜브 링크 (여러 개 입력 시 줄바꿈으로 구분)</label>
                  <textarea
                    value={editProfile.youtube_links}
                    onChange={(e) => setEditProfile({...editProfile, youtube_links: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white min-h-[80px]"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleProfileSave}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded hover:bg-white/90 transition-colors"
                  >
                    <Save size={16} />
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">한국어 이름</label>
                    <p className="text-white">{profile?.name_ko || '미설정'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">영어 이름</label>
                    <p className="text-white">{profile?.name_en || '미설정'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">소개</label>
                  <p className="text-white">{profile?.bio || '미설정'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">유튜브 링크</label>
                  <div className="space-y-2">
                    {profile?.youtube_links && profile.youtube_links.length > 0 ? (
                      profile.youtube_links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-400 hover:underline"
                        >
                          {link}
                        </a>
                      ))
                    ) : (
                      <p className="text-white/60">등록된 링크가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 경력 섹션 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">경력 관리</h2>
              <button
                onClick={handleCareersSave}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded hover:bg-white/90 transition-colors"
              >
                <Save size={16} />
                경력 저장
              </button>
            </div>

            <div className="space-y-4">
              {editCareers.map((career, index) => (
                <div key={index} className="border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">경력 #{index + 1}</h3>
                    <button
                      onClick={() => removeCareer(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">카테고리</label>
                      <select
                        value={career.type}
                        onChange={(e) => updateCareer(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      >
                        {CAREER_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">제목 *</label>
                      <input
                        type="text"
                        value={career.title}
                        onChange={(e) => updateCareer(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                        placeholder="프로젝트명/곡명"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">상세설명</label>
                      <input
                        type="text"
                        value={career.detail}
                        onChange={(e) => updateCareer(index, 'detail', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                        placeholder="부분참여 등 상세설명"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">국가 (워크샵만)</label>
                      <input
                        type="text"
                        value={career.country}
                        onChange={(e) => updateCareer(index, 'country', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                        placeholder="국가명"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold mb-2">참고영상 링크</label>
                    <input
                      type="text"
                      value={career.video_url}
                      onChange={(e) => updateCareer(index, 'video_url', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              ))}
              
              <button
                onClick={addCareer}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-bold rounded hover:bg-white/30 transition-colors"
              >
                <Plus size={16} />
                경력 추가
              </button>
            </div>

            {/* 현재 경력 표시 */}
            {careers.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">현재 등록된 경력</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {careers.map((career) => (
                    <div key={career.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white/60">
                          {CAREER_TYPES.find(t => t.value === career.type)?.label}
                        </span>
                      </div>
                      <h4 className="font-bold mb-2">{career.title}</h4>
                      {career.detail && (
                        <p className="text-sm text-white/80 mb-2">{career.detail}</p>
                      )}
                      {career.country && (
                        <p className="text-xs text-white/60">국가: {career.country}</p>
                      )}
                      {career.video_url && (
                        <a
                          href={career.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          영상 보기
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 