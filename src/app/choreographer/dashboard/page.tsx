'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { Camera, Edit, Save, X, Plus, Trash2, Upload, FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../../utils/supabase';

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
  featured_position?: number; // 1, 2, 3, 4 (대표경력1~4) 또는 undefined (일반 경력)
  created_at: string;
}

// 아티스트 프로필 타입 정의
interface ArtistProfile {
  id: string;
  user_id: string;
  profile_image?: string;
  type: string;
  artist_type: string;
  bio?: string;
  youtube_links?: string[];
  name_ko: string;
  name_en?: string;
  name_ja?: string;
  name_zh?: string;
  created_at: string;
  updated_at: string;
}

const CAREER_TYPES = [
  { value: "choreo", label: "안무제작" },
  { value: "broadcast", label: "방송출연" },
  { value: "event", label: "행사출연" },
  { value: "ad", label: "광고출연" },
  { value: "dancer", label: "댄서참여" },
  { value: "workshop", label: "워크샵" },
];

const CAREER_TYPE_DESCRIPTIONS = {
  choreo: "안무 제작 및 연출",
  broadcast: "TV, 라디오 등 방송 출연",
  event: "공연, 행사, 축제 등 출연",
  ad: "광고, CF 등 출연",
  dancer: "댄서로서 참여한 작품",
  workshop: "워크샵, 클래스 등 교육 활동",
};

// 팝업 메시지 컴포넌트
const PopupMessage = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error' | 'info'; 
  onClose: () => void; 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? <CheckCircle size={20} /> : type === 'error' ? <AlertCircle size={20} /> : <AlertCircle size={20} />;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-80`}>
        {icon}
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default function ChoreographerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeCareerTab, setActiveCareerTab] = useState<string>('all');

  // 프로필 편집 상태
  const [editProfile, setEditProfile] = useState({
    name: '',
    phone: '',
  });

  // 아티스트 프로필 편집 상태
  const [editArtistProfile, setEditArtistProfile] = useState({
    bio: '',
    youtube_links: [] as string[],
    name_ko: '',
    name_en: '',
    name_ja: '',
    name_zh: '',
  });

  // 경력 편집 상태
  const [editCareers, setEditCareers] = useState<Omit<Career, 'id' | 'artist_id' | 'created_at'>[]>([]);
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);

  // 대표경력 체크박스 상태 관리
  const [featuredCheckboxes, setFeaturedCheckboxes] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user && user.role && !['choreographer', 'partner_choreographer'].includes(user.role)) {
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
      // 1. users 테이블에서 사용자 프로필 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('User fetch error:', userError);
      }

      if (userData) {
        setUserProfile(userData);
        setEditProfile({
          name: userData.name || '',
          phone: userData.phone || '',
        });
      }

      // 2. artists 테이블에서 아티스트 프로필 조회
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (artistError && artistError.code !== 'PGRST116') {
        console.error('Artist profile fetch error:', artistError);
      } else if (artistData) {
        setArtistProfile(artistData);
        setEditArtistProfile({
          bio: artistData.bio || '',
          youtube_links: artistData.youtube_links || [],
          name_ko: artistData.name_ko || '',
          name_en: artistData.name_en || '',
          name_ja: artistData.name_ja || '',
          name_zh: artistData.name_zh || '',
        });
      } else {
        // 아티스트 프로필이 없으면 생성
        const { data: newArtistData, error: createError } = await supabase
          .from('artists')
          .insert({
            user_id: user.id,
            type: 'main',
            artist_type: user.role === 'choreographer' ? 'choreographer' : 'partner_choreographer',
            name_ko: user.name || '',
            bio: '',
            youtube_links: [],
          })
          .select()
          .single();

        if (createError) {
          console.error('Artist profile creation error:', createError);
        } else if (newArtistData) {
          setArtistProfile(newArtistData);
          setEditArtistProfile({
            bio: '',
            youtube_links: [],
            name_ko: user.name || '',
            name_en: '',
            name_ja: '',
            name_zh: '',
          });
        }
      }

      // 3. artists_careers 테이블에서 경력 조회
      const currentArtistProfile = artistData || (artistProfile ? artistProfile : null);
      if (currentArtistProfile) {
        const { data: careersData, error: careersError } = await supabase
          .from('artists_careers')
          .select('*')
          .eq('artist_id', currentArtistProfile.id)
          .order('created_at', { ascending: false });

        if (careersError) {
          console.error('Careers fetch error:', careersError);
        } else {
          setCareers(careersData || []);
          // 체크박스 상태 초기화
          setFeaturedCheckboxes({});
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

    setIsSaving(true);
    showMessage('프로필을 저장하고 있습니다...', 'info');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editProfile.name,
          phone: editProfile.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        showMessage(`프로필 업데이트 실패: ${error.message}`, 'error');
        return;
      }

      showMessage('프로필이 성공적으로 저장되었습니다!', 'success');
      setIsEditing(false);
      await fetchChoreographerData();
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('프로필 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCareersSave = async () => {
    if (!user || !artistProfile) return;

    setIsSaving(true);
    showMessage('경력을 저장하고 있습니다...', 'info');

    try {
      console.log('=== 경력 저장 시작 ===');
      console.log('기존 경력:', careers);
      console.log('편집 중인 경력:', editCareers);
      console.log('아티스트 ID:', artistProfile.id);

      // 모든 경력 데이터 준비 (기존 + 편집 중인 경력)
      const allCareers = [
        ...careers.map(career => ({
          artist_id: artistProfile.id,
          type: career.type,
          title: career.title,
          detail: career.detail || null,
          country: career.country || null,
          video_url: career.video_url || null,
          featured_position: career.featured_position || null,
        })),
        ...editCareers
          .filter(career => career.title.trim() !== '')
          .map(career => ({
            artist_id: artistProfile.id,
            type: career.type,
            title: career.title,
            detail: career.detail || null,
            country: career.country || null,
            video_url: career.video_url || null,
            featured_position: career.featured_position || null,
          }))
      ];

      console.log('저장할 모든 경력:', allCareers);

      if (allCareers.length > 0) {
        // 기존 경력 모두 삭제
        const { error: deleteError } = await supabase
          .from('artists_careers')
          .delete()
          .eq('artist_id', artistProfile.id);

        if (deleteError) {
          console.error('삭제 오류:', deleteError);
          showMessage(`기존 경력 삭제 실패: ${deleteError.message}`, 'error');
          return;
        }

        // 모든 경력 새로 삽입
        const { data: insertData, error: insertError } = await supabase
          .from('artists_careers')
          .insert(allCareers)
          .select();

        if (insertError) {
          console.error('삽입 오류:', insertError);
          showMessage(`경력 저장 실패: ${insertError.message}`, 'error');
          return;
        }

        console.log('삽입된 데이터:', insertData);
        console.log('=== 경력 저장 완료 ===');
        showMessage(`${allCareers.length}개의 경력이 성공적으로 저장되었습니다!`, 'success');
        
        // 편집 중인 경력 목록 초기화
        setEditCareers([]);
        // 체크박스 상태 초기화
        setFeaturedCheckboxes({});
      } else {
        console.log('저장할 경력이 없음');
        showMessage('저장할 경력이 없습니다.', 'info');
      }

      await fetchChoreographerData();
    } catch (error) {
      console.error('Error saving careers:', error);
      showMessage('경력 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addCareer = () => {
    // 현재 선택된 탭의 타입으로 새 경력 추가
    const newCareerType = activeCareerTab === 'all' ? 'choreo' : activeCareerTab;
    setEditCareers([...editCareers, {
      type: newCareerType,
      title: '',
      detail: '',
      country: '',
      video_url: '',
      featured_position: undefined,
    }]);
  };

  const removeCareer = (index: number) => {
    setEditCareers(editCareers.filter((_, i) => i !== index));
  };

  // 경력 수정 시작
  const startEditCareer = (career: Career) => {
    setEditingCareerId(career.id);
    setEditCareers([{
      type: career.type,
      title: career.title,
      detail: career.detail || '',
      country: career.country || '',
      video_url: career.video_url || '',
      featured_position: career.featured_position,
    }]);
  };

  // 경력 수정 취소
  const cancelEditCareer = () => {
    setEditingCareerId(null);
    setEditCareers([]);
  };

  // 경력 수정 저장
  const saveEditCareer = async () => {
    if (!artistProfile || !editingCareerId || editCareers.length === 0) return;

    setIsSaving(true);
    showMessage('경력을 수정하고 있습니다...', 'info');

    try {
      const careerToUpdate = editCareers[0];
      
      const { error } = await supabase
        .from('artists_careers')
        .update({
          type: careerToUpdate.type,
          title: careerToUpdate.title,
          detail: careerToUpdate.detail || null,
          country: careerToUpdate.country || null,
          video_url: careerToUpdate.video_url || null,
          featured_position: careerToUpdate.featured_position || null,
        })
        .eq('id', editingCareerId);

      if (error) {
        showMessage(`경력 수정 실패: ${error.message}`, 'error');
        return;
      }

      showMessage('경력이 성공적으로 수정되었습니다!', 'success');
      setEditingCareerId(null);
      setEditCareers([]);
      // 체크박스 상태 초기화
      setFeaturedCheckboxes({});
      await fetchChoreographerData();
    } catch (error) {
      console.error('Error updating career:', error);
      showMessage('경력 수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 경력 삭제
  const deleteCareer = async (careerId: string) => {
    if (!confirm('정말로 이 경력을 삭제하시겠습니까?')) return;

    setIsSaving(true);
    showMessage('경력을 삭제하고 있습니다...', 'info');

    try {
      const { error } = await supabase
        .from('artists_careers')
        .delete()
        .eq('id', careerId);

      if (error) {
        showMessage(`경력 삭제 실패: ${error.message}`, 'error');
        return;
      }

      showMessage('경력이 성공적으로 삭제되었습니다!', 'success');
      // 체크박스 상태 초기화
      setFeaturedCheckboxes({});
      await fetchChoreographerData();
    } catch (error) {
      console.error('Error deleting career:', error);
      showMessage('경력 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 아티스트 프로필 저장 함수
  const handleArtistProfileSave = async () => {
    if (!user || !artistProfile) return;

    setIsSaving(true);
    showMessage('아티스트 프로필을 저장하고 있습니다...', 'info');

    try {
      const { error } = await supabase
        .from('artists')
        .update({
          bio: editArtistProfile.bio,
          youtube_links: editArtistProfile.youtube_links,
          name_ko: editArtistProfile.name_ko,
          name_en: editArtistProfile.name_en,
          name_ja: editArtistProfile.name_ja,
          name_zh: editArtistProfile.name_zh,
        })
        .eq('id', artistProfile.id);

      if (error) {
        showMessage(`아티스트 프로필 업데이트 실패: ${error.message}`, 'error');
        return;
      }

      showMessage('아티스트 프로필이 성공적으로 저장되었습니다!', 'success');
      await fetchChoreographerData();
    } catch (error) {
      console.error('Error saving artist profile:', error);
      showMessage('아티스트 프로필 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCareer = (index: number, field: string, value: string) => {
    setEditCareers(editCareers.map((career, i) =>
      i === index ? { ...career, [field]: value } : career
    ));
  };

  // 이미지 업로드 함수
  const handleImageUpload = async (file: File) => {
    if (!user || !artistProfile) return;

    showMessage('이미지를 업로드하고 있습니다...', 'info');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `artist-profiles/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        showMessage(`이미지 업로드 실패: ${uploadError.message}`, 'error');
        return;
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 아티스트 프로필 업데이트
      const { error: updateError } = await supabase
        .from('artists')
        .update({ profile_image: publicUrl })
        .eq('id', artistProfile.id);

      if (updateError) {
        showMessage(`프로필 이미지 업데이트 실패: ${updateError.message}`, 'error');
        return;
      }

      showMessage('프로필 이미지가 성공적으로 업로드되었습니다!', 'success');
      await fetchChoreographerData();
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('이미지 업로드 중 오류가 발생했습니다.', 'error');
    }
  };

  // 경력 대량등록 함수
  const handleBulkUpload = () => {
    if (!bulkText.trim()) {
      showMessage('경력 데이터를 입력해주세요.', 'error');
      return;
    }

    console.log('대량등록 텍스트:', bulkText);
    const lines = bulkText.trim().split('\n').filter(line => line.trim());
    console.log('분리된 줄들:', lines);
    
    const newCareers: Omit<Career, 'id' | 'artist_id' | 'created_at'>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(',').map(part => part.trim());
      console.log(`줄 ${i}:`, parts);
      
      // 첫 번째 줄이 헤더인지 확인 (타입,제목,상세,국가,비디오URL)
      if (i === 0 && (parts[0] === '타입' || parts[0] === 'type' || parts[0] === 'Type')) {
        console.log('헤더 줄 건너뛰기:', parts[0]);
        continue; // 헤더 줄은 건너뛰기
      }
      
      if (parts.length >= 2) {
        const [type, title, detail = '', country = '', video_url = ''] = parts;
        
        // 타입 검증
        const validType = CAREER_TYPES.find(t => t.value === type) ? type : 'choreo';
        
        const newCareer = {
          type: validType,
          title,
          detail,
          country,
          video_url,
        };
        
        console.log('추가할 경력:', newCareer);
        newCareers.push(newCareer);
      }
    }

    console.log('최종 추가할 경력들:', newCareers);
    console.log('현재 editCareers:', editCareers);

    if (newCareers.length > 0) {
      const updatedCareers = [...editCareers, ...newCareers];
      console.log('업데이트된 editCareers:', updatedCareers);
      setEditCareers(updatedCareers);
      setBulkText('');
      setShowBulkUpload(false);
      showMessage(`${newCareers.length}개의 경력이 추가되었습니다. 저장 버튼을 눌러주세요.`, 'success');
    } else {
      showMessage('올바른 형식의 데이터를 입력해주세요.', 'error');
    }
  };

  // CSV 파일 업로드 함수
  const handleCSVUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setBulkText(text);
        setShowBulkUpload(true);
      }
    };
    reader.readAsText(file);
  };

  // CSV 템플릿 다운로드 함수
  const downloadCSVTemplate = () => {
    const template = `타입,제목,상세,국가,비디오URL
choreo,2023 K-POP 안무 제작,아이돌 그룹 메인 곡 안무 제작 및 연출,한국,https://youtube.com/watch?v=example1
broadcast,댄싱 위드 더 스타 출연,시즌 3 참가자로 출연,한국,https://youtube.com/watch?v=example2
event,서울 댄스 페스티벌,메인 공연 안무가로 참여,한국,https://youtube.com/watch?v=example3
ad,삼성 갤럭시 광고,댄서로 출연한 TV 광고,한국,https://youtube.com/watch?v=example4
dancer,뮤지컬 '캣츠' 댄서,뮤지컬 댄서로 참여,한국,https://youtube.com/watch?v=example5
workshop,서울 댄스 아카데미,주니어 댄서 대상 워크샵 진행,한국,https://youtube.com/watch?v=example6`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'career_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 메시지 표시 함수
  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  // 카테고리별 경력 필터링
  const getFilteredCareers = () => {
    if (activeCareerTab === 'all') {
      return careers;
    }
    return careers.filter(career => career.type === activeCareerTab);
  };

  // 카테고리별 경력 개수
  const getCareerCount = (type: string) => {
    if (type === 'all') {
      return careers.length;
    }
    return careers.filter(career => career.type === type).length;
  };

  // 대표경력 체크박스 변경 핸들러
  const handleFeaturedCheckboxChange = (careerId: string, checked: boolean) => {
    const currentType = careers.find(c => c.id === careerId)?.type;
    if (!currentType) return;

    if (checked) {
      // 체크된 경우: 현재 카테고리의 대표경력 개수 확인 후 다음 번호 할당
      const currentFeaturedCareers = careers.filter(c => 
        c.type === currentType && c.featured_position && c.id !== careerId
      );
      
      if (currentFeaturedCareers.length < 4) {
        const nextPosition = currentFeaturedCareers.length + 1;
        setCareers(prev => prev.map(c => 
          c.id === careerId 
            ? { ...c, featured_position: nextPosition }
            : c
        ));
        setFeaturedCheckboxes(prev => ({ ...prev, [careerId]: true }));
      } else {
        showMessage('각 카테고리별로 대표경력은 최대 4개까지 설정할 수 있습니다.', 'error');
      }
    } else {
      // 체크 해제된 경우: 대표경력 해제 후 번호 재정렬
      setCareers(prev => {
        const updatedCareers = prev.map(c => 
          c.id === careerId 
            ? { ...c, featured_position: undefined }
            : c
        );
        
        // 같은 카테고리의 대표경력들 번호 재정렬
        const sameTypeCareers = updatedCareers
          .filter(c => c.type === currentType && c.featured_position)
          .sort((a, b) => (a.featured_position || 0) - (b.featured_position || 0));
        
        return updatedCareers.map(career => {
          if (career.type === currentType && career.featured_position) {
            const index = sameTypeCareers.findIndex(fc => fc.id === career.id);
            return { ...career, featured_position: index >= 0 ? index + 1 : undefined };
          }
          return career;
        });
      });
      
      setFeaturedCheckboxes(prev => ({ ...prev, [careerId]: false }));
    }
  };



  if (loading || isLoading) {
    return (
      <>
        <Header title="댄서 대시보드" />
        <div className="max-w-4xl mx-auto py-10 px-4">
          <div className="text-center text-gray-400">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header title="댄서 대시보드" />
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* 팝업 메시지 */}
        {message && (
          <PopupMessage 
            message={message} 
            type={messageType} 
            onClose={() => setMessage(null)} 
          />
        )}

        {/* 통합된 프로필 관리 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">프로필 관리</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                <Edit size={16} />
                수정
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await handleProfileSave();
                    await handleArtistProfileSave();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isSaving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditProfile({
                      name: userProfile?.name || '',
                      phone: userProfile?.phone || '',
                    });
                    setEditArtistProfile({
                      bio: artistProfile?.bio || '',
                      youtube_links: artistProfile?.youtube_links || [],
                      name_ko: artistProfile?.name_ko || '',
                      name_en: artistProfile?.name_en || '',
                      name_ja: artistProfile?.name_ja || '',
                      name_zh: artistProfile?.name_zh || '',
                    });
                  }}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  <X size={16} />
                  취소
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">이름 *</label>
                    <input
                      type="text"
                      value={editProfile.name}
                      onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">전화번호</label>
                    <input
                      type="text"
                      value={editProfile.phone}
                      onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">이메일</label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      className="w-full border px-3 py-2 rounded bg-gray-100"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">역할</label>
                    <input
                      type="text"
                      value={userProfile?.role === 'choreographer' ? '전속안무가' : '파트너댄서'}
                      className="w-full border px-3 py-2 rounded bg-gray-100"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* 프로필 이미지 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">프로필 이미지</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {artistProfile?.profile_image ? (
                      <img
                        src={artistProfile.profile_image}
                        alt="프로필 이미지"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/window.svg';
                        }}
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      <Upload size={16} />
                      이미지 업로드
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF 파일 (최대 5MB)</p>
                  </div>
                </div>
              </div>

              {/* 다국어 이름 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">다국어 이름</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">한국어 이름</label>
                    <input
                      type="text"
                      value={editArtistProfile.name_ko}
                      onChange={(e) => setEditArtistProfile({...editArtistProfile, name_ko: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">영어 이름</label>
                    <input
                      type="text"
                      value={editArtistProfile.name_en}
                      onChange={(e) => setEditArtistProfile({...editArtistProfile, name_en: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">일본어 이름</label>
                    <input
                      type="text"
                      value={editArtistProfile.name_ja}
                      onChange={(e) => setEditArtistProfile({...editArtistProfile, name_ja: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">중국어 이름</label>
                    <input
                      type="text"
                      value={editArtistProfile.name_zh}
                      onChange={(e) => setEditArtistProfile({...editArtistProfile, name_zh: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* 소개 및 링크 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">소개 및 링크</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">소개</label>
                    <textarea
                      value={editArtistProfile.bio}
                      onChange={(e) => setEditArtistProfile({...editArtistProfile, bio: e.target.value})}
                      className="w-full border px-3 py-2 rounded"
                      rows={4}
                      placeholder="자신을 소개해주세요..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">YouTube 링크</label>
                    <input
                      type="text"
                      value={editArtistProfile.youtube_links.join(', ')}
                      onChange={(e) => setEditArtistProfile({
                        ...editArtistProfile, 
                        youtube_links: e.target.value.split(',').map(link => link.trim()).filter(link => link)
                      })}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="YouTube 링크들을 쉼표로 구분하여 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 기본 정보 표시 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">이름</label>
                    <p className="text-lg">{userProfile?.name || '이름 없음'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">전화번호</label>
                    <p className="text-lg">{userProfile?.phone || '전화번호 없음'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">이메일</label>
                    <p className="text-lg">{userProfile?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">역할</label>
                    <p className="text-lg">{userProfile?.role === 'choreographer' ? '전속안무가' : '파트너댄서'}</p>
                  </div>
                </div>
              </div>

              {/* 프로필 이미지 표시 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">프로필 이미지</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {artistProfile?.profile_image ? (
                      <img
                        src={artistProfile.profile_image}
                        alt="프로필 이미지"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/window.svg';
                        }}
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      className="hidden"
                      id="profile-image-upload-display"
                    />
                    <label
                      htmlFor="profile-image-upload-display"
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      <Upload size={16} />
                      이미지 업로드
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF 파일 (최대 5MB)</p>
                  </div>
                </div>
              </div>

              {/* 다국어 이름 표시 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">다국어 이름</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">한국어 이름</label>
                    <p className="text-lg">{artistProfile?.name_ko || '미설정'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">영어 이름</label>
                    <p className="text-lg">{artistProfile?.name_en || '미설정'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">일본어 이름</label>
                    <p className="text-lg">{artistProfile?.name_ja || '미설정'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">중국어 이름</label>
                    <p className="text-lg">{artistProfile?.name_zh || '미설정'}</p>
                  </div>
                </div>
              </div>

              {/* 소개 및 링크 표시 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">소개 및 링크</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">소개</label>
                    <p className="text-lg">{artistProfile?.bio || '소개가 없습니다.'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">YouTube 링크</label>
                    <div className="space-y-2">
                      {artistProfile?.youtube_links && artistProfile.youtube_links.length > 0 ? (
                        artistProfile.youtube_links.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            {link}
                          </a>
                        ))
                      ) : (
                        <p className="text-lg text-gray-500">등록된 링크가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 경력 관리 섹션 */}
        {artistProfile && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">경력 관리</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkUpload(!showBulkUpload)}
                  className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                >
                  <FileText size={16} />
                  대량등록
                </button>
                <button
                  onClick={downloadCSVTemplate}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  <Download size={16} />
                  템플릿
                </button>
                <button
                  onClick={addCareer}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  <Plus size={16} />
                  경력 추가
                </button>
              </div>
            </div>

            {/* 경력 통계 */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">경력 통계</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CAREER_TYPES.map(type => (
                  <div key={type.value} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getCareerCount(type.value)}
                    </div>
                    <div className="text-sm text-gray-600">{type.label}</div>
                  </div>
                ))}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {getCareerCount('all')}
                  </div>
                  <div className="text-sm text-gray-600">전체</div>
                </div>
              </div>
            </div>

            {/* 카테고리별 탭 */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                {[
                  { value: 'all', label: '전체', color: 'bg-gray-500' },
                  { value: 'choreo', label: '안무제작', color: 'bg-blue-500' },
                  { value: 'broadcast', label: '방송출연', color: 'bg-purple-500' },
                  { value: 'event', label: '행사출연', color: 'bg-green-500' },
                  { value: 'ad', label: '광고출연', color: 'bg-yellow-500' },
                  { value: 'dancer', label: '댄서참여', color: 'bg-red-500' },
                  { value: 'workshop', label: '워크샵', color: 'bg-indigo-500' }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveCareerTab(tab.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                      activeCareerTab === tab.value
                        ? `${tab.color} text-white`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activeCareerTab === tab.value
                        ? 'bg-white/20'
                        : 'bg-gray-300'
                    }`}>
                      {getCareerCount(tab.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 대량등록 섹션 */}
            {showBulkUpload && (
              <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">경력 대량등록</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    CSV 파일을 업로드하거나 아래 텍스트 영역에 경력 데이터를 입력하세요.
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    형식: 타입,제목,상세,국가,비디오URL (각 줄마다 하나의 경력)
                  </p>
                  <div className="text-xs text-gray-600 mb-3">
                    <p className="font-semibold mb-1">사용 가능한 타입:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(CAREER_TYPE_DESCRIPTIONS).map(([type, desc]) => (
                        <div key={type} className="flex">
                          <span className="font-mono text-purple-600 mr-2">{type}:</span>
                          <span>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleCSVUpload(file);
                        }
                      }}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors cursor-pointer text-sm"
                    >
                      <Upload size={14} />
                      CSV 업로드
                    </label>
                  </div>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full h-32 border px-3 py-2 rounded text-sm"
                  placeholder={`choreo,2023 K-POP 안무 제작,아이돌 그룹 메인 곡 안무 제작 및 연출,한국,https://youtube.com/watch?v=example1
broadcast,댄싱 위드 더 스타 출연,시즌 3 참가자로 출연,한국,https://youtube.com/watch?v=example2
event,서울 댄스 페스티벌,메인 공연 안무가로 참여,한국,https://youtube.com/watch?v=example3`}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleBulkUpload}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    <Plus size={16} />
                    경력 추가
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkUpload(false);
                      setBulkText('');
                    }}
                    className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    <X size={16} />
                    취소
                  </button>
                </div>
              </div>
            )}

          <div className="space-y-4">
            {/* 통합된 경력 목록 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                경력 목록
                {activeCareerTab !== 'all' && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({CAREER_TYPES.find(t => t.value === activeCareerTab)?.label})
                  </span>
                )}
              </h3>
              
              {/* 경력 목록 */}
              {getFilteredCareers().map((career) => (
                <div key={career.id} className="border rounded p-4 bg-white mb-3 shadow-sm">
                  {editingCareerId === career.id ? (
                    // 수정 모드
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded font-medium">
                          {CAREER_TYPES.find(t => t.value === editCareers[0]?.type)?.label || editCareers[0]?.type}
                        </span>
                        <span className="text-sm text-orange-600 font-medium">수정 중</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">타입</label>
                          <select
                            value={editCareers[0]?.type || ''}
                            onChange={(e) => setEditCareers([{ ...editCareers[0], type: e.target.value }])}
                            className="w-full border px-3 py-2 rounded"
                          >
                            {CAREER_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">제목 *</label>
                          <input
                            type="text"
                            value={editCareers[0]?.title || ''}
                            onChange={(e) => setEditCareers([{ ...editCareers[0], title: e.target.value }])}
                            className="w-full border px-3 py-2 rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">상세</label>
                          <input
                            type="text"
                            value={editCareers[0]?.detail || ''}
                            onChange={(e) => setEditCareers([{ ...editCareers[0], detail: e.target.value }])}
                            className="w-full border px-3 py-2 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">국가</label>
                          <input
                            type="text"
                            value={editCareers[0]?.country || ''}
                            onChange={(e) => setEditCareers([{ ...editCareers[0], country: e.target.value }])}
                            className="w-full border px-3 py-2 rounded"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">비디오 URL</label>
                          <input
                            type="text"
                            value={editCareers[0]?.video_url || ''}
                            onChange={(e) => setEditCareers([{ ...editCareers[0], video_url: e.target.value }])}
                            className="w-full border px-3 py-2 rounded"
                            placeholder="YouTube 링크 등"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">대표경력 설정</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`featured-edit-${editingCareerId}`}
                              checked={!!editCareers[0]?.featured_position}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) {
                                  // 현재 카테고리의 대표경력 개수 확인
                                  const currentType = editCareers[0]?.type;
                                  const currentFeaturedCount = careers.filter(c => 
                                    c.type === currentType && c.featured_position && c.id !== editingCareerId
                                  ).length;
                                  
                                  if (currentFeaturedCount < 4) {
                                    setEditCareers([{ 
                                      ...editCareers[0], 
                                      featured_position: currentFeaturedCount + 1 
                                    }]);
                                  } else {
                                    showMessage('각 카테고리별로 대표경력은 최대 4개까지 설정할 수 있습니다.', 'error');
                                  }
                                } else {
                                  setEditCareers([{ 
                                    ...editCareers[0], 
                                    featured_position: undefined 
                                  }]);
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`featured-edit-${editingCareerId}`} className="text-sm text-gray-700">
                              대표경력으로 설정
                            </label>
                          </div>
                          {editCareers[0]?.featured_position && (
                            <p className="text-xs text-blue-600 mt-1">
                              대표경력 {editCareers[0].featured_position}번으로 설정됨
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            각 카테고리별로 대표경력 4개까지 등록 가능합니다
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={saveEditCareer}
                          disabled={isSaving}
                          className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <Save size={14} />
                          {isSaving ? '저장 중...' : '저장'}
                        </button>
                        <button
                          onClick={cancelEditCareer}
                          className="flex items-center gap-2 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                        >
                          <X size={14} />
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 보기 모드
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-medium">
                            {CAREER_TYPES.find(t => t.value === career.type)?.label || career.type}
                          </span>
                          {career.featured_position && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-medium">
                              대표경력 {career.featured_position}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              id={`featured-${career.id}`}
                              checked={!!career.featured_position}
                              onChange={(e) => handleFeaturedCheckboxChange(career.id, e.target.checked)}
                              className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`featured-${career.id}`} className="text-xs text-gray-600">
                              대표
                            </label>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditCareer(career)}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => deleteCareer(career.id)}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-1">{career.title}</h4>
                      {career.detail && <p className="text-sm text-gray-600 mb-2">{career.detail}</p>}
                      <div className="flex gap-4 text-xs text-gray-500">
                        {career.country && <span>📍 {career.country}</span>}
                        {career.video_url && (
                          <a href={career.video_url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            🎥 비디오 보기
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 새 경력 추가 영역 */}
              {editCareers.length > 0 && editingCareerId === null && (
                <div className="border-2 border-green-300 rounded p-4 bg-green-50 mb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">
                      {CAREER_TYPES.find(t => t.value === editCareers[0]?.type)?.label || editCareers[0]?.type}
                    </span>
                    <span className="text-sm text-green-600 font-medium">새 경력</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">타입</label>
                      <select
                        value={editCareers[0]?.type || ''}
                        onChange={(e) => setEditCareers([{ ...editCareers[0], type: e.target.value }])}
                        className="w-full border px-3 py-2 rounded"
                      >
                        {CAREER_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">제목 *</label>
                      <input
                        type="text"
                        value={editCareers[0]?.title || ''}
                        onChange={(e) => setEditCareers([{ ...editCareers[0], title: e.target.value }])}
                        className="w-full border px-3 py-2 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">상세</label>
                      <input
                        type="text"
                        value={editCareers[0]?.detail || ''}
                        onChange={(e) => setEditCareers([{ ...editCareers[0], detail: e.target.value }])}
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">국가</label>
                      <input
                        type="text"
                        value={editCareers[0]?.country || ''}
                        onChange={(e) => setEditCareers([{ ...editCareers[0], country: e.target.value }])}
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">비디오 URL</label>
                      <input
                        type="text"
                        value={editCareers[0]?.video_url || ''}
                        onChange={(e) => setEditCareers([{ ...editCareers[0], video_url: e.target.value }])}
                        className="w-full border px-3 py-2 rounded"
                        placeholder="YouTube 링크 등"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">대표경력 설정</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="featured-new"
                          checked={!!editCareers[0]?.featured_position}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              // 현재 카테고리의 대표경력 개수 확인
                              const currentType = editCareers[0]?.type;
                              const currentFeaturedCount = careers.filter(c => 
                                c.type === currentType && c.featured_position
                              ).length;
                              
                              if (currentFeaturedCount < 4) {
                                setEditCareers([{ 
                                  ...editCareers[0], 
                                  featured_position: currentFeaturedCount + 1 
                                }]);
                              } else {
                                showMessage('각 카테고리별로 대표경력은 최대 4개까지 설정할 수 있습니다.', 'error');
                              }
                            } else {
                              setEditCareers([{ 
                                ...editCareers[0], 
                                featured_position: undefined 
                              }]);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="featured-new" className="text-sm text-gray-700">
                          대표경력으로 설정
                        </label>
                      </div>
                      {editCareers[0]?.featured_position && (
                        <p className="text-xs text-blue-600 mt-1">
                          대표경력 {editCareers[0].featured_position}번으로 설정됨
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        각 카테고리별로 대표경력 4개까지 등록 가능합니다
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={handleCareersSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Save size={14} />
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => setEditCareers([])}
                      className="flex items-center gap-2 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                    >
                      <X size={14} />
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 빠른 경력 추가 버튼 */}
            {editCareers.length === 0 && editingCareerId === null && (
              <div className="mt-4 text-center">
                <button
                  onClick={addCareer}
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors mx-auto shadow-md"
                >
                  <Plus size={18} />
                  {activeCareerTab === 'all' ? '새 경력 추가' : `${CAREER_TYPES.find(t => t.value === activeCareerTab)?.label} 경력 추가`}
                </button>
              </div>
            )}

            {/* 빈 상태 메시지 */}
            {getFilteredCareers().length === 0 && editCareers.length === 0 && editingCareerId === null && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-lg font-medium mb-2">
                  {activeCareerTab === 'all' ? '등록된 경력이 없습니다' : `${CAREER_TYPES.find(t => t.value === activeCareerTab)?.label} 경력이 없습니다`}
                </p>
                <p className="text-sm">
                  {activeCareerTab === 'all' 
                    ? '새로운 경력을 추가해보세요!' 
                    : '다른 카테고리에서 경력을 추가하거나 새로 등록해보세요.'
                  }
                </p>
                <button
                  onClick={addCareer}
                  className="mt-4 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors mx-auto"
                >
                  <Plus size={16} />
                  경력 추가
                </button>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleCareersSave}
              disabled={isSaving}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '저장 중...' : '경력 저장'}
            </button>
          </div>
        </div>
        )}

        
      </div>
    </>
  );
} 