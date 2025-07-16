'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@supabase/supabase-js";
import type { Artist, ArtistCareer } from "../../components/ArtistProfile";
import { getYoutubeThumb, isYoutubeUrl } from "../../utils/youtube";
import Header from "../../components/Header";
import { useTranslation } from "../../utils/useTranslation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CAREER_TYPES = [
  { value: "choreo", label: "choreo" },
  { value: "broadcast", label: "broadcast" },
  { value: "event", label: "event" },
  { value: "ad", label: "ad" },
  { value: "dancer", label: "dancer" },
  { value: "workshop", label: "workshop" },
];

async function fetchArtists() {
  const { data, error } = await supabase
    .from("artists")
    .select("id, name_ko, profile_image, bio, youtube_links, team_id, artists_careers(id, type, title, detail, country, video_url)")
    .order("created_at", { ascending: false });
  return data || [];
}

function getMainImage(artist: Artist): string {
  // 대표 미디어(유튜브 썸네일 > artist.media > profile_image > fallback)
  const youtube = Array.isArray(artist.youtube_links) ? artist.youtube_links.find((l: string) => isYoutubeUrl(l)) : null;
  if (youtube) {
    const thumb = getYoutubeThumb(youtube);
    if (thumb) return thumb;
  }
  if (Array.isArray(artist.media) && artist.media.length > 0) {
    return artist.media[0].url;
  }
  if (artist.profile_image) return artist.profile_image;
  return "/window.svg";
}

// 따옴표 제거 함수
function removeQuotes(text: string): string {
  return text.replace(/^["']|["']$/g, '');
}

function ArtistCard({ artist, onShowCareers }: { artist: Artist, onShowCareers: (artist: Artist) => void }) {
  const router = useRouter();
  const mainImage = getMainImage(artist);
  const { t } = useTranslation();
  
  // 대표 경력들 추출
  const choreoCareer = (artist.artists_careers || []).find(c => c.type === 'choreo');
  const adCareer = (artist.artists_careers || []).find(c => c.type === 'ad');
  const broadcastCareer = (artist.artists_careers || []).find(c => c.type === 'broadcast');
  
  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-xl cursor-pointer min-h-[400px] flex flex-col justify-end bg-black/80 hover:scale-105 transition-transform duration-300"
      onClick={() => router.push(`/artists/${artist.id}`)}
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/artists/${artist.id}`); }}
      role="button"
      aria-label={`${artist.name_ko || t('artists')} 상세보기`}
    >
      {/* 배경 이미지 - 선명하게 */}
      <div className="absolute inset-0 z-0">
        <img
          src={mainImage}
          alt={artist.name_ko || "아티스트"}
          className="w-full h-full object-cover scale-110 group-hover:scale-105 transition-all duration-300"
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      
      {/* 글래스 오버레이 */}
      <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all duration-300" />
      
      {/* 내용 레이어 */}
      <div className="relative z-10 p-6 flex flex-col justify-end h-full">
        {/* 아티스트 이름과 영문명 */}
        <div className="mb-4">
          <div className="text-2xl font-extrabold text-white drop-shadow-lg mb-1">
            {artist.name_ko || t('artists')}
            {artist.name_en && (
              <span className="text-sm text-gray-300 font-medium ml-2">
                {artist.name_en}
              </span>
            )}
          </div>
        </div>
        
        {/* 대표 경력들 */}
        <div className="space-y-2">
          {choreoCareer && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">{t('choreo')}:</span>
              <span className="text-xs text-white truncate">{removeQuotes(choreoCareer.title)}</span>
            </div>
          )}
          {broadcastCareer && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">{t('broadcast')}:</span>
              <span className="text-xs text-white truncate">{removeQuotes(broadcastCareer.title)}</span>
            </div>
          )}
        </div>
        
        {/* 더보기 버튼 */}
        {artist.artists_careers && artist.artists_careers.length > 3 && (
          <button
            type="button"
            className="text-xs text-gray-300 underline mt-2 hover:text-white transition-colors"
            onClick={e => { e.stopPropagation(); onShowCareers(artist); }}
          >
            {t('more')} +{artist.artists_careers.length - 3}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ArtistListPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [careerModal, setCareerModal] = useState<{artist: Artist} | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchArtists().then(data => {
      setArtists(data as Artist[]);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Header title={t('artist_list')} />
      <div className="max-w-4xl mx-auto py-10 px-4">
      {loading ? (
        <div className="text-center text-gray-400">{t('loading')}</div>
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
            <div className="text-lg font-bold text-gray-800 mb-4 pr-8">{careerModal.artist.name_ko || t('artists')} {t('career')} {careerModal.artist.artists_careers?.length ?? 0}{t('more')}</div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-6">
              {CAREER_TYPES.map(careerType => {
                const careersOfType = (careerModal.artist.artists_careers || []).filter(c => c.type === careerType.value);
                if (careersOfType.length === 0) return null;
                
                return (
                  <div key={careerType.value} className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">
                      {t(careerType.label)}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {careersOfType.map((c) => {
                        const thumb = getYoutubeThumb(c.video_url || "");
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