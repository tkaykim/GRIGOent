'use client';

import ArtistProfile from "../../../components/ArtistProfile";
import ArtistMediaSlider from "../../../components/ArtistMediaSlider";
import ArtistContactButton from "../../../components/ArtistContactButton";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Artist, ArtistCareer } from "../../../components/ArtistProfile";
import { getYoutubeThumb, getYoutubeVideoId, isYoutubeUrl } from "../../../utils/youtube";
import Header from "../../../components/Header";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CAREER_TYPES = [
  { value: "choreo", label: "안무제작" },
  { value: "broadcast", label: "방송출연" },
  { value: "event", label: "행사출연" },
  { value: "ad", label: "광고출연" },
  { value: "dancer", label: "댄서참여" },
  { value: "workshop", label: "워크샵" },
  { value: "other", label: "기타" },
];

// 따옴표 제거 함수
function removeQuotes(text: string): string {
  return text.replace(/^["']|["']$/g, '');
}

function groupCareersByType(careers: unknown[]) {
  const grouped: Record<string, unknown[]> = {};
  (careers as { type?: string }[]).forEach(c => {
    const type = c.type || "other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(c);
  });
  return grouped;
}

async function fetchArtistById(id: string) {
  const { data, error } = await supabase
    .from("artists")
    .select("*, artists_careers(*)")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching artist:", error);
    return null;
  }
  
  return data;
}

export default function ArtistDetailPage(props: any) {
  const { id } = props.params;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [careerModal, setCareerModal] = useState<{type: string, careers: ArtistCareer[]} | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<ArtistCareer | null>(null);

  useEffect(() => {
    fetchArtistById(id).then(data => {
      setArtist(data as Artist);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <>
      <Header title="Artists" />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center text-gray-400">불러오는 중...</div>
      </main>
    </>
  );
  
  if (!artist) return (
    <>
      <Header title="Artists" />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center text-red-400">아티스트 정보를 찾을 수 없습니다.</div>
      </main>
    </>
  );

  // 커리어 타입별 그룹핑
  const careers = Array.isArray(artist.artists_careers) ? artist.artists_careers : [];
  const groupedCareers = groupCareersByType(careers);

  return (
    <>
      <Header title={`${artist.name_ko || "아티스트"}${artist.name_en ? ` (${artist.name_en})` : ""}`} />
      <main className="max-w-4xl mx-auto py-10 px-4">
        {/* 아티스트 헤더 섹션 */}
        <div className="relative mb-8 rounded-2xl overflow-hidden min-h-[300px] flex items-end">
          {/* 배경 이미지 */}
          <div className="absolute inset-0 z-0">
            <img
              src={artist.profile_image || "/window.svg"}
              alt={artist.name_ko || "아티스트"}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>
          
          {/* 아티스트 정보 */}
          <div className="relative z-10 p-8 text-white">
            <div className="text-4xl font-extrabold mb-2 drop-shadow-lg">
              {artist.name_ko || "아티스트"}
              {artist.name_en && (
                <span className="text-lg text-gray-300 font-medium ml-3">
                  {artist.name_en}
                </span>
              )}
            </div>
            {artist.bio && (
              <div className="text-gray-200 text-lg max-w-2xl drop-shadow">
                {artist.bio}
              </div>
            )}
          </div>
        </div>

        {/* 미디어 슬라이더 */}
        {artist.media && artist.media.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">미디어</h2>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <ArtistMediaSlider media={artist.media} />
            </div>
          </section>
        )}

        {/* 경력사항 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">경력사항</h2>
          <div className="space-y-8">
            {CAREER_TYPES.map(type => {
              const list = (groupedCareers[type.value] as ArtistCareer[]) || [];
              if (list.length === 0) return null;
              const preview = list.slice(0, 3);
              
              return (
                <div key={type.value} className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{type.label}</h3>
                    {list.length > 3 && (
                      <button
                        className="text-sm text-gray-300 underline hover:text-white transition-colors"
                        onClick={() => setCareerModal({ type: type.label, careers: list })}
                        type="button"
                      >
                        더보기 +{list.length - 3}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {preview.map((c) => {
                      const ytThumb = getYoutubeThumb(c.video_url || "");
                      
                      return (
                        <div
                          key={c.id}
                          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:bg-white/20 transition-all duration-300 border border-white/10"
                          onClick={() => setSelectedCareer(c)}
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedCareer(c); }}
                          role="button"
                          aria-label="경력 상세 보기"
                        >
                          {ytThumb && (
                            <img 
                              src={ytThumb} 
                              alt="영상 썸네일" 
                              className="w-full h-32 rounded-lg object-cover mb-3 border border-white/20" 
                            />
                          )}
                          <div className="space-y-2">
                            <div className="font-semibold text-white text-sm line-clamp-2">
                              {removeQuotes(c.title)}
                            </div>
                            {c.detail && (
                              <div className="text-xs text-gray-300 line-clamp-2">
                                {removeQuotes(c.detail)}
                              </div>
                            )}
                            {c.country && (
                              <div className="text-xs text-gray-400">국가: {c.country}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        
        {/* 더보기 모달 */}
        {careerModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setCareerModal(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-4xl w-full mx-4 p-8 relative shadow-2xl max-h-[90vh] overflow-hidden border border-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-black hover:text-white bg-white hover:bg-black border border-black rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10 transition-colors"
                onClick={() => setCareerModal(null)}
                aria-label="닫기"
              >
                ×
              </button>
              <div className="text-xl font-extrabold text-black mb-6 text-center tracking-tight">{careerModal.type} 전체 경력 <span className="text-base font-normal text-gray-500">({careerModal.careers.length}개)</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
                {careerModal.careers.map((c: ArtistCareer) => {
                  const ytThumb = getYoutubeThumb(c.video_url || "");
                  
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-xl p-5 cursor-pointer hover:bg-black hover:text-white transition-all duration-300 border border-black/10 shadow-md"
                      onClick={() => setSelectedCareer(c)}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedCareer(c); }}
                      role="button"
                      aria-label="경력 상세 보기"
                    >
                      {ytThumb && (
                        <img 
                          src={ytThumb} 
                          alt="영상 썸네일" 
                          className="w-full h-32 rounded-lg object-cover mb-3 border border-black/10" 
                        />
                      )}
                      <div className="space-y-2">
                        <div className="font-bold text-black text-base line-clamp-2 group-hover:text-white">
                          {removeQuotes(c.title)}
                        </div>
                        {c.detail && (
                          <div className="text-sm text-gray-700 line-clamp-2 group-hover:text-gray-200">
                            {removeQuotes(c.detail)}
                          </div>
                        )}
                        {c.country && (
                          <div className="text-xs text-gray-500 group-hover:text-gray-300">국가: {c.country}</div>
                        )}
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
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedCareer(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full mx-4 p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto border border-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-black hover:text-white bg-white hover:bg-black border border-black rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10 transition-colors"
                onClick={() => setSelectedCareer(null)}
                aria-label="닫기"
              >
                ×
              </button>
              
              {/* 영상/이미지 */}
              {selectedCareer.video_url && isYoutubeUrl(selectedCareer.video_url) ? (
                <div className="w-full aspect-video mb-6">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedCareer.video_url)}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg border border-gray-300"
                  />
                </div>
              ) : selectedCareer.video_url ? (
                <div className="w-full mb-6">
                  <img 
                    src={selectedCareer.video_url} 
                    alt="미디어" 
                    className="w-full h-64 object-cover rounded-lg border border-black/10" 
                    onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }} 
                  />
                </div>
              ) : null}
              
              {/* 작품 설명 */}
              <div className="text-center">
                <div className="text-2xl font-extrabold text-black mb-4">{removeQuotes(selectedCareer.title)}</div>
                {selectedCareer.detail && (
                  <div className="text-base text-gray-800 mb-4 whitespace-pre-line">{removeQuotes(selectedCareer.detail)}</div>
                )}
                {selectedCareer.country && (
                  <div className="text-sm text-gray-500 mb-3">국가: {selectedCareer.country}</div>
                )}
                {selectedCareer.video_url && !isYoutubeUrl(selectedCareer.video_url) && (
                  <a 
                    href={selectedCareer.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-black underline hover:text-white hover:bg-black px-2 py-1 rounded transition-colors"
                  >
                    외부 링크로 보기
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 고정된 섭외문의 버튼 */}
        <div className="fixed bottom-6 right-6 z-40">
          <ArtistContactButton 
            artistName={artist.name_ko || "아티스트"} 
            artistList={[{ 
              id: artist.id, 
              name_ko: artist.name_ko || "", 
              name_en: artist.name_en || undefined 
            }]} 
          />
        </div>
      </main>
    </>
  );
} 