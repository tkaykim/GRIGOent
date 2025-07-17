'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "../../components/Header";
import { useTranslation } from "../../utils/useTranslation";
import { supabase } from "../../utils/supabase";
import { getYoutubeThumb } from "../../utils/youtube";

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
  slug?: string;
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
  { value: "choreo", label: "choreo" },
  { value: "broadcast", label: "broadcast" },
  { value: "event", label: "event" },
  { value: "ad", label: "ad" },
  { value: "dancer", label: "dancer" },
  { value: "workshop", label: "workshop" },
];

async function fetchArtists() {
  try {
    console.log('아티스트 목록 조회 시작...');
    
    // 단일 쿼리로 모든 데이터 조회 (JOIN 사용)
    const { data: artists, error } = await supabase
      .from('users')
      .select(`
        id,
        slug,
        email,
        name,
        role,
        phone,
        is_active,
        created_at,
        updated_at,
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
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching artists:', error);
      throw new Error(`아티스트 목록 조회 실패: ${error.message}`);
    }

    console.log('아티스트 데이터:', artists);

    // 데이터 구조 변환
    const formattedArtists = (artists || []).map((user: any) => {
      console.log('사용자 데이터:', user);
      console.log('아티스트 프로필:', user.artists);
      console.log('사용자 slug:', user.slug);
      
      return {
        ...user,
        artist_profile: user.artists || null,
        careers: user.artists?.artists_careers || []
      };
    });

    console.log('포맷된 아티스트 목록:', formattedArtists);
    return formattedArtists;
  } catch (error) {
    console.error('Exception fetching artists:', error);
    throw error;
  }
}

// 따옴표 제거 함수
function removeQuotes(text: string): string {
  return text.replace(/^["']|["']$/g, '');
}

function ArtistCard({ artist, onShowCareers }: { artist: Artist, onShowCareers: (artist: Artist) => void }) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  
  console.log('ArtistCard 렌더링:', artist);
  console.log('아티스트 프로필:', artist.artist_profile);
  console.log('경력:', artist.careers);
  
  // 대표 경력들 추출 (featured_position이 있는 경력들)
  const featuredCareers = (artist.careers || [])
    .filter(c => c.featured_position && c.featured_position >= 1 && c.featured_position <= 4)
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return (a.featured_position || 0) - (b.featured_position || 0);
    })
    .slice(0, 3); // 최대 3개까지만 표시
  
  // 대표 경력이 없으면 일반 경력에서 대표작 추출
  const fallbackCareers = featuredCareers.length === 0 ? [
    (artist.careers || []).find(c => c.type === 'choreo'),
    (artist.careers || []).find(c => c.type === 'ad'),
    (artist.careers || []).find(c => c.type === 'broadcast')
  ].filter(Boolean).slice(0, 3) : [];
  
  // 아티스트 이름 (다국어 지원)
  const getArtistName = () => {
    if (lang === 'ko' && artist.artist_profile?.name_ko) return artist.artist_profile.name_ko;
    if (lang === 'en' && artist.artist_profile?.name_en) return artist.artist_profile.name_en;
    return artist.name || t('artists');
  };
  
  // 역할에 따른 표시 텍스트
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'choreographer':
        return t('choreographer');
      case 'partner_choreographer':
        return t('partner_choreographer');
      default:
        return role;
    }
  };
  
  const handleArtistClick = () => {
    const url = `/artists/${artist.slug || artist.id}`;
    console.log('아티스트 클릭:', { name: artist.name, slug: artist.slug, id: artist.id, url });
    router.push(url);
  };

  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-xl cursor-pointer min-h-[400px] flex flex-col justify-end bg-black/80 hover:scale-105 transition-transform duration-300"
      onClick={handleArtistClick}
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') handleArtistClick(); }}
      role="button"
      aria-label={`${artist.name || t('artists')} 상세보기`}
    >
      {/* 배경 이미지 - 프로필 이미지 또는 기본 이미지 사용 */}
      <div className="absolute inset-0 z-0">
        <img
          src={artist.artist_profile?.profile_image || "/window.svg"}
          alt={artist.name || "아티스트"}
          className="w-full h-full object-cover scale-110 group-hover:scale-105 transition-all duration-300"
          loading="lazy"
          decoding="async"
          onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      
      {/* 글래스 오버레이 */}
      <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all duration-300" />
      
      {/* 내용 레이어 */}
      <div className="relative z-10 p-6 flex flex-col justify-end h-full">
        {/* 아티스트 이름과 역할 */}
        <div className="mb-4">
          <div className="text-2xl font-extrabold text-white drop-shadow-lg mb-1">
            {getArtistName()}
          </div>
          <div className="text-sm text-gray-300 font-medium">
            {getRoleDisplay(artist.role)}
          </div>
        </div>
        
        {/* 대표 경력들 */}
        <div className="space-y-2">
          {featuredCareers.length > 0 ? (
            // 대표경력이 있는 경우
            featuredCareers.map((career, index) => (
              <div key={career.id} className="flex items-center gap-2">
                <span className="text-xs bg-yellow-500 text-black px-1 py-0.5 rounded font-bold">
                  {career.featured_position}
                </span>
                <span className="text-xs text-gray-400 font-semibold">
                  {CAREER_TYPES.find(t => t.value === career.type)?.label || career.type}:
                </span>
                <span className="text-xs text-white truncate">{removeQuotes(career.title)}</span>
              </div>
            ))
          ) : (
            // 대표경력이 없는 경우 기존 방식
            fallbackCareers.map((career, index) => (
              <div key={career?.id || index} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">
                  {CAREER_TYPES.find(t => t.value === career?.type)?.label || career?.type}:
                </span>
                <span className="text-xs text-white truncate">{removeQuotes(career?.title || '')}</span>
              </div>
            ))
          )}
        </div>
        
        {/* 더보기 버튼 */}
        {artist.careers && artist.careers.length > 3 && (
          <button
            type="button"
            className="text-xs text-gray-300 underline mt-2 hover:text-white transition-colors"
            onClick={e => { e.stopPropagation(); onShowCareers(artist); }}
          >
            {t('more')} +{artist.careers.length - 3}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ArtistListPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerModal, setCareerModal] = useState<{artist: Artist} | null>(null);
  const [cachedArtists, setCachedArtists] = useState<Artist[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const loadArtists = async () => {
      // 캐시된 데이터가 있으면 먼저 표시
      if (cachedArtists.length > 0) {
        setArtists(cachedArtists);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchArtists();
        setArtists(data as Artist[]);
        setCachedArtists(data as Artist[]); // 캐시 업데이트
      } catch (err) {
        console.error('아티스트 목록 로드 실패:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, []);

  return (
    <>
      <Header title={t('artist_list')} />
      <div className="max-w-4xl mx-auto py-10 px-4">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-square rounded-2xl bg-gray-200 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-400">
          <div className="mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center text-gray-400">{t('no_artist')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {artists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} onShowCareers={a => setCareerModal({artist: a})} />
          ))}
        </div>
      )}
      {/* 경력 모달 */}
      {careerModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCareerModal(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-lg w-full mx-4 p-6 relative shadow-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold z-10"
              onClick={() => setCareerModal(null)}
              aria-label={t('contact_cancel')}
            >
              ×
            </button>
            <div className="text-lg font-bold text-gray-800 mb-4 pr-8">{careerModal.artist.name || t('artists')} {t('career')} {careerModal.artist.careers?.length ?? 0}{t('more')}</div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-6">
              {CAREER_TYPES.map(careerType => {
                const careersOfType = (careerModal.artist.careers || []).filter(c => c.type === careerType.value);
                if (careersOfType.length === 0) return null;
                
                return (
                  <div key={careerType.value} className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">
                      {t(careerType.label)}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {careersOfType.map((c) => {
                        const thumb = c.video_url ? getYoutubeThumb(c.video_url) : null;
                        return (
                          <div key={c.id} className="rounded-xl bg-gray-100 p-3 flex gap-3 items-center shadow-sm">
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
                              ) : c.video_url ? (
                                <div className="w-20 h-14 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-200">
                                  <a 
                                    href={c.video_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {t('media')}
                                  </a>
                                </div>
                              ) : (
                                <div className="w-20 h-14 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-200">
                                  <span className="text-xs text-gray-500">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{removeQuotes(c.title)}</div>
                              {c.detail && <div className="text-xs text-gray-600 truncate">{removeQuotes(c.detail)}</div>}
                              {c.country && <div className="text-xs text-gray-500">국가: {c.country}</div>}
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
      )}
      </div>
    </>
  );
} 