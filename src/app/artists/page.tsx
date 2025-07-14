'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@supabase/supabase-js";
import type { Artist, ArtistCareer } from "../../components/ArtistProfile";
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

function getYoutubeThumb(url: string) {
  if (!url) return null;
  if (url.includes("youtube.com")) {
    const match = url.match(/v=([\w-]+)/);
    const vid = match ? match[1] : null;
    if (vid) return `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
  } else if (url.includes("youtu.be")) {
    const match = url.match(/youtu.be\/([\w-]+)/);
    const vid = match ? match[1] : null;
    if (vid) return `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
  }
  return null;
}

function getMainImage(artist: Artist): string {
  // 대표 미디어(유튜브 썸네일 > artist.media > profile_image > fallback)
  const youtube = Array.isArray(artist.youtube_links) ? artist.youtube_links.find((l: string) => l.includes("youtube.com") || l.includes("youtu.be")) : null;
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

function ArtistCard({ artist, onShowCareers, onShowCareerModal }: { artist: Artist, onShowCareers: (artist: Artist) => void, onShowCareerModal: (type: string, careers: any[]) => void }) {
  const router = useRouter();
  const mainImage = getMainImage(artist);
  const mainCareers = (artist.artists_careers || []).slice(0, 3);
  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-xl cursor-pointer min-h-[320px] flex flex-col justify-end bg-black/80 hover:scale-105 transition-transform duration-300"
      onClick={() => router.push(`/artists/${artist.id}`)}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/artists/${artist.id}`); }}
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
            className="text-xs text-blue-200 underline mb-1 hover:text-blue-400"
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
  // 타입별 경력 모달 상태 추가
  const [careerTypeModal, setCareerTypeModal] = useState<{type: string, careers: any[]} | null>(null);
  // 영상 상세 모달 상태 추가
  const [selectedCareer, setSelectedCareer] = useState<any | null>(null);

  useEffect(() => {
    fetchArtists().then(data => {
      setArtists(data as Artist[]);
      setLoading(false);
    });
  }, []);

  const handleShowCareerModal = (type: string, careers: any[]) => {
    setCareerTypeModal({ type, careers });
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-extrabold mb-8 text-center">아티스트 리스트</h1>
      {loading ? (
        <div className="text-center text-gray-400">불러오는 중...</div>
      ) : artists.length === 0 ? (
        <div className="text-center text-gray-400">등록된 아티스트가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {artists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} onShowCareers={a => setCareerModal({artist: a})} onShowCareerModal={handleShowCareerModal} />
          ))}
        </div>
      )}
      {/* 경력 모달 - 관리자 페이지와 동일하게 수정 */}
      {careerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-2xl max-h-[80vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
              onClick={() => setCareerModal(null)}
              aria-label="닫기"
            >
              ×
            </button>
            <div className="text-lg font-bold text-pink-600 mb-4">{careerModal.artist.name_ko || "아티스트"} 전체 경력</div>
            
            {/* 경력사항을 타입별로 그룹화하여 표시 */}
            <div className="space-y-4">
              {CAREER_TYPES.map(type => {
                const careers = (careerModal.artist.artists_careers || []).filter((c: any) => c.type === type.value);
                if (careers.length === 0) return null;
                const preview = careers.slice(0, 3);
                return (
                  <div key={type.value} className="mb-4">
                    <div className="text-base font-bold text-pink-500 mb-2 flex items-center gap-2">
                      {type.label}
                      {careers.length > 3 && (
                        <button
                          className="text-xs text-blue-300 underline ml-2 hover:text-blue-400"
                          onClick={() => setCareerTypeModal({ type: type.label, careers })}
                          type="button"
                        >
                          더보기 +{careers.length - 3}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {preview.map((c: any) => {
                        const ytThumb = getYoutubeThumb(c.video_url || "");
                        return (
                          <div
                            key={c.id}
                            className="rounded-xl bg-gray-100 p-3 flex gap-3 items-center shadow-sm cursor-pointer hover:bg-gray-200 transition"
                            onClick={() => setSelectedCareer(c)}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedCareer(c); }}
                            role="button"
                            aria-label="경력 상세 보기"
                          >
                            {ytThumb ? (
                              <img src={ytThumb} alt="영상 썸네일" className="w-20 h-14 rounded-lg object-cover border border-gray-300" />
                            ) : c.video_url ? (
                              <span className="text-xs underline text-blue-600">영상보기</span>
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{c.title}</div>
                              {c.detail && <div className="text-xs text-gray-600 truncate">{c.detail}</div>}
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

      {/* 타입별 경력 모달 */}
      {careerTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
              onClick={() => setCareerTypeModal(null)}
              aria-label="닫기"
            >
              ×
            </button>
            <div className="text-lg font-bold text-pink-600 mb-4">{careerTypeModal.type} 전체 경력 ({careerTypeModal.careers.length}개)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {careerTypeModal.careers.map((c: any) => {
                const ytThumb = getYoutubeThumb(c.video_url || "");
                return (
                  <div
                    key={c.id}
                    className="rounded-xl bg-gray-100 p-3 flex gap-3 items-center shadow-sm cursor-pointer hover:bg-gray-200 transition"
                    onClick={() => setSelectedCareer(c)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedCareer(c); }}
                    role="button"
                    aria-label="경력 상세 보기"
                  >
                    {ytThumb ? (
                      <img src={ytThumb} alt="영상 썸네일" className="w-20 h-14 rounded-lg object-cover border border-gray-300" />
                    ) : c.video_url ? (
                      <span className="text-xs underline text-blue-600">영상보기</span>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{c.title}</div>
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

      {/* 영상 상세 모달 */}
      {selectedCareer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl flex flex-col items-center">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
              onClick={() => setSelectedCareer(null)}
              aria-label="닫기"
            >
              ×
            </button>
            {/* 영상 플레이어 */}
            {selectedCareer.video_url && (selectedCareer.video_url.includes("youtube.com") || selectedCareer.video_url.includes("youtu.be")) ? (
              <div className="w-full aspect-video mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${(() => {
                    if (selectedCareer.video_url.includes("youtube.com")) {
                      const match = selectedCareer.video_url.match(/v=([\w-]+)/);
                      return match ? match[1] : "";
                    } else if (selectedCareer.video_url.includes("youtu.be")) {
                      const match = selectedCareer.video_url.match(/youtu.be\/([\w-]+)/);
                      return match ? match[1] : "";
                    }
                    return "";
                  })()}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-56 rounded-lg border border-gray-300"
                />
              </div>
            ) : selectedCareer.video_url ? (
              <div className="w-full mb-4">
                <a href={selectedCareer.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">외부 영상 보기</a>
              </div>
            ) : null}
            {/* 작품 설명 */}
            <div className="w-full text-center">
              <div className="text-lg font-bold text-gray-900 mb-1">{selectedCareer.title}</div>
              {selectedCareer.detail && <div className="text-base text-gray-700 mb-1">{selectedCareer.detail}</div>}
              {selectedCareer.country && <div className="text-sm text-gray-500 mb-1">국가: {selectedCareer.country}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 