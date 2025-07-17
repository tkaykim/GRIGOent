'use client';

import React, { useEffect, useState, use } from "react";
import { supabase } from "../../../utils/supabase";
import { getYoutubeThumb, getYoutubeVideoId, isYoutubeUrl } from "../../../utils/youtube";
import Header from "../../../components/Header";
import { useTranslation } from "../../../utils/useTranslation";
import { useRouter } from 'next/navigation';
import ArtistContactButton from '../../../components/ArtistContactButton';

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

// 아티스트 타입 (사용자 + 아티스트 프로필 + 경력)
interface Artist {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  artist_profile?: ArtistProfile;
  careers?: Career[];
}

const CAREER_TYPES = [
  { value: "choreo", label: "안무제작" },
  { value: "broadcast", label: "방송출연" },
  { value: "event", label: "행사출연" },
  { value: "ad", label: "광고출연" },
  { value: "dancer", label: "댄서참여" },
  { value: "workshop", label: "워크샵" },
  { value: "other", label: "기타" },
];

const FEATURED_WORK_CATEGORIES = [
  { value: "performance", label: "공연" },
  { value: "choreography", label: "안무" },
  { value: "competition", label: "대회" },
  { value: "showcase", label: "쇼케이스" },
  { value: "broadcast", label: "방송" },
  { value: "event", label: "행사" },
];

// 따옴표 제거 함수
function removeQuotes(text: string): string {
  return text.replace(/^["']|["']$/g, '');
}

function groupCareersByType(careers: Career[]) {
  const grouped: Record<string, Career[]> = {};
  careers.forEach(c => {
    const type = c.type || "other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(c);
  });
  return grouped;
}

// 대표경력과 일반 경력을 분리하는 함수
function separateFeaturedCareers(careers: Career[]) {
  const featured: Career[] = [];
  const regular: Career[] = [];
  
  careers.forEach(career => {
    if (career.featured_position && career.featured_position >= 1 && career.featured_position <= 4) {
      featured.push(career);
    } else {
      regular.push(career);
    }
  });
  
  // 대표경력을 카테고리별, 위치 순으로 정렬
  featured.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return (a.featured_position || 0) - (b.featured_position || 0);
  });
  
  return { featured, regular };
}

// 카테고리별로 대표경력을 그룹화하는 함수
function groupFeaturedCareersByType(careers: Career[]) {
  const grouped: Record<string, Career[]> = {};
  
  careers.forEach(career => {
    if (career.featured_position && career.featured_position >= 1 && career.featured_position <= 4) {
      if (!grouped[career.type]) {
        grouped[career.type] = [];
      }
      grouped[career.type].push(career);
    }
  });
  
  // 각 카테고리 내에서 위치 순으로 정렬
  Object.keys(grouped).forEach(type => {
    grouped[type].sort((a, b) => (a.featured_position || 0) - (b.featured_position || 0));
  });
  
  return grouped;
}

async function fetchArtistById(id: string) {
  try {
    console.log('아티스트 조회 시작, ID:', id);
    
    // UUID인지 slug인지 확인
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // 단일 쿼리로 모든 데이터 조회 (JOIN 사용)
    let query = supabase
      .from("users")
      .select(`
        *,
        artists!inner(
          id,
          profile_image,
          type,
          artist_type,
          bio,
          youtube_links,
          name_ko,
          name_en,
          name_ja,
          name_zh,
          created_at,
          updated_at,
          artists_careers(
            id,
            type,
            title,
            detail,
            country,
            video_url,
            featured_position,
            created_at
          )
        )
      `)
      .in('role', ['choreographer', 'partner_choreographer'])
      .eq('is_active', true);
    
    if (isUUID) {
      // UUID로 조회
      query = query.eq("id", id);
    } else {
      // slug로 조회
      query = query.eq("slug", id);
    }
    
    const { data: userData, error: userError } = await query.single();
    
    if (userError) {
      console.error("Error fetching user:", userError);
      return null;
    }

    console.log('사용자 데이터:', userData);
    console.log('아티스트 프로필:', userData.artists);
    console.log('경력 데이터:', userData.artists?.artists_careers);

    // 데이터 구조 변환
    return {
      ...userData,
      artist_profile: userData.artists || null,
      careers: userData.artists?.artists_careers || []
    };
  } catch (error) {
    console.error("Exception fetching artist:", error);
    return null;
  }
}

// 역할에 따른 표시 텍스트
function getRoleDisplay(role: string) {
  switch (role) {
    case 'choreographer':
      return '전속안무가';
    case 'partner_choreographer':
      return '파트너댄서';
    default:
      return role;
  }
}

export default function ArtistDetailPage(props: any) {
  const params = use(props.params) as { id: string };
  const { id } = params;
  const { t, lang, setLang } = useTranslation();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [careerModal, setCareerModal] = useState<{type: string, careers: Career[]} | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('아티스트 상세페이지 로드 시작, ID:', id);
    fetchArtistById(id).then(data => {
      console.log('아티스트 데이터 조회 결과:', data);
      console.log('아티스트 프로필:', data?.artist_profile);
      console.log('경력 데이터:', data?.careers);
      setArtist(data as Artist);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <>
      <Header title="Artists" />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center text-gray-400">{t('loading')}</div>
      </main>
    </>
  );
  
  if (!artist) return (
    <>
      <Header title="Artists" />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center text-red-400">{t('not_found')}</div>
      </main>
    </>
  );

  // 커리어 타입별 그룹핑
  const careers = artist.careers || [];
  const groupedCareers = groupCareersByType(careers);

  // 아티스트 이름 (다국어 지원)
  const getArtistName = () => {
    if (lang === 'ko' && artist.artist_profile?.name_ko) return artist.artist_profile.name_ko;
    if (lang === 'en' && artist.artist_profile?.name_en) return artist.artist_profile.name_en;
    return artist.name || "아티스트";
  };

  return (
    <>
      <Header title={`${artist.name || "아티스트"}`} />
      <main className="min-h-screen bg-black">
        {/* 언어 전환 버튼 */}
        <div className="fixed top-20 right-6 z-30">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
            <button
              className={`px-3 py-1 rounded text-sm font-bold border transition-colors ${
                lang === 'ko' 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-white border-white/30 hover:bg-white/10'
              }`}
              onClick={() => setLang('ko')}
            >
              KR
            </button>
            <span className="text-white/40 text-sm">|</span>
            <button
              className={`px-3 py-1 rounded text-sm font-bold border transition-colors ${
                lang === 'en' 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-white border-white/30 hover:bg-white/10'
              }`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
        </div>

        {/* PC 친화적 레이아웃 */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 아티스트 헤더 섹션 - 모바일용 */}
          <div className="lg:hidden relative mb-8 rounded-2xl overflow-hidden min-h-[300px] flex items-end">
            {/* 배경 이미지 */}
            <div className="absolute inset-0 z-0">
              <img
                src={artist.artist_profile?.profile_image || "/window.svg"}
                alt={artist.name || "아티스트"}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
            
            {/* 아티스트 정보 */}
            <div className="relative z-10 p-8 text-white">
              <div className="text-4xl font-extrabold mb-2 drop-shadow-lg">
                {getArtistName()}
              </div>
              <div className="text-lg text-gray-300 font-medium mb-2">
                {getRoleDisplay(artist.role)}
              </div>
            </div>
          </div>

          {/* PC 레이아웃 */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-12">
            {/* 왼쪽 - 프로필 이미지 */}
            <div className="lg:col-span-5">
              <div className="sticky top-32">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-white/10">
                  <img
                    src={artist.artist_profile?.profile_image || "/window.svg"}
                    alt={artist.name || "아티스트"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                
                {/* 아티스트 정보 */}
                <div className="mt-8 text-white">
                  <h1 className="text-5xl font-black mb-4 tracking-tight">
                    {getArtistName()}
                  </h1>
                  <p className="text-2xl text-gray-300 font-medium mb-4">
                    {getRoleDisplay(artist.role)}
                  </p>
                  {/* 문의하기 버튼 (PC) */}
                  <div className="mt-4">
                    <ArtistContactButton 
                      artistName={getArtistName()}
                      artistList={artist.artist_profile ? [{
                        id: artist.artist_profile.id,
                        name_ko: artist.artist_profile.name_ko,
                        name_en: artist.artist_profile.name_en
                      }] : []}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 - 경력 정보 */}
            <div className="lg:col-span-7">
              <div className="space-y-8">
                {/* 대표경력 섹션 */}
                {(() => {
                  const featuredByType = groupFeaturedCareersByType(artist.careers || []);
                  const hasFeaturedCareers = Object.keys(featuredByType).length > 0;
                  
                  if (!hasFeaturedCareers) return null;
                  
                  return (
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl p-8 border border-yellow-500/30">
                      <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-3xl font-bold text-white">대표경력</h2>
                        <span className="text-yellow-300 text-sm font-medium">Featured Works</span>
                      </div>
                      
                      <div className="space-y-6">
                        {Object.entries(featuredByType).map(([type, careers]) => (
                          <div key={type} className="space-y-3">
                            <h3 className="text-lg font-semibold text-yellow-300 border-b border-yellow-500/30 pb-2">
                              {CAREER_TYPES.find(t => t.value === type)?.label || type}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {careers.map((career) => {
                                const thumb = career.video_url ? getYoutubeThumb(career.video_url) : null;
                                return (
                                  <div 
                                    key={career.id} 
                                    className="bg-white/10 rounded-2xl p-4 border border-yellow-500/30 hover:bg-white/15 transition-colors cursor-pointer relative"
                                    onClick={() => setSelectedCareer(career)}
                                  >
                                    {/* 대표경력 배지 */}
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                                      {career.featured_position}
                                    </div>
                                    
                                    <div className="flex gap-3">
                                      <div className="flex-shrink-0">
                                        {thumb ? (
                                          <img 
                                            src={thumb} 
                                            alt="영상 썸네일" 
                                            className="w-16 h-12 rounded-lg object-cover border border-yellow-500/30"
                                            onError={e => { 
                                              (e.target as HTMLImageElement).src = '/window.svg'; 
                                              (e.target as HTMLImageElement).className = "w-16 h-12 rounded-lg object-contain border border-yellow-500/30 p-2";
                                            }}
                                          />
                                        ) : career.video_url ? (
                                          <div className="w-16 h-12 rounded-lg border border-yellow-500/30 flex items-center justify-center bg-white/10">
                                            <a 
                                              href={career.video_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-xs text-yellow-300 hover:text-yellow-100 transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              미디어
                                            </a>
                                          </div>
                                        ) : (
                                          <div className="w-16 h-12 rounded-lg border border-yellow-500/30 flex items-center justify-center bg-white/10">
                                            <span className="text-xs text-white/50">No Image</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">{removeQuotes(career.title)}</div>
                                        {career.detail && <div className="text-xs text-white/70 truncate">{removeQuotes(career.detail)}</div>}
                                        {career.country && <div className="text-xs text-white/50">국가: {career.country}</div>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 일반 경력 섹션 */}
                {CAREER_TYPES.map(type => {
                  const { regular } = separateFeaturedCareers(artist.careers || []);
                  const list = regular.filter(career => career.type === type.value);
                  if (list.length === 0) return null;
                  const preview = list.slice(0, 4); // PC에서는 4개까지 표시
                  
                  return (
                    <div key={type.value} className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-white">{type.label}</h2>
                        {list.length > 4 && (
                          <button
                            onClick={() => setCareerModal({type: type.value, careers: list})}
                            className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                          >
                            전체보기 ({list.length})
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {preview.map((career) => {
                          const thumb = career.video_url ? getYoutubeThumb(career.video_url) : null;
                          return (
                            <div 
                              key={career.id} 
                              className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                              onClick={() => setSelectedCareer(career)}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  {thumb ? (
                                    <img 
                                      src={thumb} 
                                      alt="영상 썸네일" 
                                      className="w-16 h-12 rounded-lg object-cover border border-white/20"
                                      onError={e => { 
                                        (e.target as HTMLImageElement).src = '/window.svg'; 
                                        (e.target as HTMLImageElement).className = "w-16 h-12 rounded-lg object-contain border border-white/20 p-2";
                                      }}
                                    />
                                  ) : career.video_url ? (
                                    <div className="w-16 h-12 rounded-lg border border-white/20 flex items-center justify-center bg-white/10">
                                      <a 
                                        href={career.video_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-xs text-white/70 hover:text-white transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        미디어
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-12 rounded-lg border border-white/20 flex items-center justify-center bg-white/10">
                                      <span className="text-xs text-white/50">No Image</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-white truncate">{removeQuotes(career.title)}</div>
                                  {career.detail && <div className="text-xs text-white/70 truncate">{removeQuotes(career.detail)}</div>}
                                  {career.country && <div className="text-xs text-white/50">국가: {career.country}</div>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}


              </div>
            </div>
          </div>
          {/* 모바일용 문의하기 버튼 */}
          <div className="lg:hidden mt-8 flex justify-center">
            <ArtistContactButton 
              artistName={getArtistName()}
              artistList={artist.artist_profile ? [{
                id: artist.artist_profile.id,
                name_ko: artist.artist_profile.name_ko,
                name_en: artist.artist_profile.name_en
              }] : []}
            />
          </div>
        </div>

        {/* 경력 모달 */}
        {careerModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setCareerModal(null)}
          >
            <div 
              className="bg-white rounded-xl max-w-4xl w-full mx-4 p-6 relative shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold z-10"
                onClick={() => setCareerModal(null)}
                aria-label="닫기"
              >
                ×
              </button>
              <div className="text-lg font-bold text-gray-800 mb-4 pr-8">
                {CAREER_TYPES.find(t => t.value === careerModal.type)?.label} ({careerModal.careers.length}개)
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {careerModal.careers.map((career) => {
                    const thumb = career.video_url ? getYoutubeThumb(career.video_url) : null;
                    return (
                      <div key={career.id} className="rounded-xl bg-gray-100 p-4 flex gap-3 items-start shadow-sm">
                        <div className="flex-shrink-0">
                          {thumb ? (
                            <img 
                              src={thumb} 
                              alt="영상 썸네일" 
                              className="w-20 h-14 rounded-lg object-cover border border-gray-300"
                              onError={e => { 
                                (e.target as HTMLImageElement).src = '/window.svg'; 
                                (e.target as HTMLImageElement).className = "w-20 h-14 rounded-lg object-contain border border-gray-300 p-2";
                              }}
                            />
                          ) : career.video_url ? (
                            <div className="w-20 h-14 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-200">
                              <a 
                                href={career.video_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                미디어
                              </a>
                            </div>
                          ) : (
                            <div className="w-20 h-14 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-200">
                              <span className="text-xs text-gray-500">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{removeQuotes(career.title)}</div>
                          {career.detail && <div className="text-sm text-gray-600 mt-1">{removeQuotes(career.detail)}</div>}
                          {career.country && <div className="text-xs text-gray-500 mt-1">국가: {career.country}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 개별 경력 모달 */}
        {selectedCareer && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCareer(null)}
          >
            <div 
              className="bg-white rounded-xl max-w-2xl w-full mx-4 p-6 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold z-10"
                onClick={() => setSelectedCareer(null)}
                aria-label="닫기"
              >
                ×
              </button>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">{removeQuotes(selectedCareer.title)}</h3>
                {selectedCareer.detail && (
                  <p className="text-gray-600">{removeQuotes(selectedCareer.detail)}</p>
                )}
                {selectedCareer.country && (
                  <p className="text-sm text-gray-500">국가: {selectedCareer.country}</p>
                )}
                {selectedCareer.video_url && (
                  <div className="mt-4">
                    <a 
                      href={selectedCareer.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      영상 보기
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
} 