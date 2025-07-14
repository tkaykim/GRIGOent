'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@supabase/supabase-js";
import type { Artist, ArtistCareer } from "../../components/ArtistProfile";
import { getYoutubeThumb, isYoutubeUrl } from "../../utils/youtube";
import Header from "../../components/Header";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CAREER_TYPES = [
  { value: "choreo", label: "안무제작" },
  { value: "broadcast", label: "방송출연" },
  { value: "event", label: "행사출연" },
  { value: "ad", label: "광고출연" },
  { value: "dancer", label: "댄서참여" },
  { value: "workshop", label: "워크샵" },
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

function ArtistCard({ artist, onShowCareers }: { artist: Artist, onShowCareers: (artist: Artist) => void }) {
  const router = useRouter();
  const mainImage = getMainImage(artist);
  const mainCareers = (artist.artists_careers || []).slice(0, 3);
  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-xl cursor-pointer min-h-[320px] flex flex-col justify-end bg-black/80 hover:scale-105 transition-transform duration-300"
      onClick={() => router.push(`/artists/${artist.id}`)}
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/artists/${artist.id}`); }}
      role="button"
      aria-label={`${artist.name_ko || "아티스트"} 상세보기`}
    >
      {/* 배경 이미지 + 블러 + 오버레이 */}
      <div className="absolute inset-0 z-0">
        <img
          src={mainImage}
          alt={artist.name_ko || "아티스트"}
          className="w-full h-full object-cover scale-110 blur-sm brightness-75 group-hover:blur-md group-hover:brightness-50 transition-all duration-300"
          onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>
      {/* 내용 레이어 */}
      <div className="relative z-10 p-6 flex flex-col items-center text-white">
        <img
          src={artist.profile_image || mainImage}
          alt={artist.name_ko || "아티스트"}
          className="w-20 h-20 rounded-full object-cover border-4 border-white/40 shadow-lg mb-3 bg-gray-800"
          onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
        />
        <div className="text-2xl font-extrabold mb-1 text-center drop-shadow-lg">{artist.name_ko || "아티스트"}</div>
        <div className="flex flex-col gap-1 w-full mb-2">
          {mainCareers.map((c) => (
            <div key={c.id} className="flex items-center gap-2 w-full">
              <span className="text-xs text-pink-300 font-semibold truncate drop-shadow">{CAREER_TYPES.find(t => t.value === c.type)?.label || c.type}: {c.title}</span>
            </div>
          ))}
        </div>
        {artist.artists_careers && artist.artists_careers.length > 3 && (
          <button
            type="button"
            className="text-xs text-blue-200 underline mb-1 hover:text-blue-400 transition-colors"
            onClick={e => { e.stopPropagation(); onShowCareers(artist); }}
          >
            더보기 +{artist.artists_careers.length - 3}
          </button>
        )}
        <div className="text-sm text-gray-200 text-center line-clamp-2 mb-1 drop-shadow">{artist.bio}</div>
        {artist.team_id && (
          <div className="text-xs text-gray-300 mt-1">팀 소속</div>
        )}
      </div>
      {/* 아티스틱한 오버레이 효과 */}
      <div className="absolute inset-0 pointer-events-none group-hover:backdrop-blur-sm group-hover:bg-pink-500/10 transition-all duration-300" />
    </div>
  );
}

export default function ArtistListPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [careerModal, setCareerModal] = useState<{artist: Artist} | null>(null);

  useEffect(() => {
    fetchArtists().then(data => {
      setArtists(data as Artist[]);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Header title="아티스트 리스트" />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-center">아티스트 리스트</h1>
      {loading ? (
        <div className="text-center text-gray-400">불러오는 중...</div>
      ) : artists.length === 0 ? (
        <div className="text-center text-gray-400">등록된 아티스트가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {artists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} onShowCareers={a => setCareerModal({artist: a})} />
          ))}
        </div>
      )}
      {/* 경력 모달 */}
      {careerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6 relative shadow-2xl max-h-[90vh] overflow-hidden">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold z-10"
              onClick={() => setCareerModal(null)}
              aria-label="닫기"
            >
              ×
            </button>
            <div className="text-lg font-bold text-pink-600 mb-4 pr-8">{careerModal.artist.name_ko || "아티스트"} 전체 경력 {careerModal.artist.artists_careers?.length ?? 0}개</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {(careerModal.artist.artists_careers || []).map((c) => {
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
                            영상보기
                          </a>
                        </div>
                      ) : (
                        <div className="w-20 h-14 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-200">
                          <span className="text-xs text-gray-500">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{CAREER_TYPES.find(t => t.value === c.type)?.label || c.type}: {c.title}</div>
                      {c.detail && <div className="text-xs text-gray-600 truncate">{c.detail}</div>}
                      {c.country && <div className="text-xs text-gray-500">국가: {c.country}</div>}
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