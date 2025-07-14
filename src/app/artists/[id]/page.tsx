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

  if (loading) return <main className="py-10 text-center text-gray-400">불러오는 중...</main>;
  if (!artist) return <main className="py-10 text-center text-red-400">아티스트 정보를 찾을 수 없습니다.</main>;

  // 커리어 타입별 그룹핑
  const careers = Array.isArray(artist.artists_careers) ? artist.artists_careers : [];
  const groupedCareers = groupCareersByType(careers);

  return (
    <>
      <Header title={artist.name_ko || "아티스트 상세"} />
      <main className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">{artist.name_ko || "아티스트"} 상세</h1>
        <ArtistProfile artist={artist} />
        <div className="my-8">
          <ArtistMediaSlider media={artist.media || []} />
        </div>
        {/* 커리어 타입별 섹션 - admin 페이지와 동일한 구조로 변경 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">경력사항</h2>
          <div className="space-y-6">
            {CAREER_TYPES.map(type => {
              const list = (groupedCareers[type.value] as ArtistCareer[]) || [];
              if (list.length === 0) return null;
              const preview = list.slice(0, 3);
              return (
                <div key={type.value} className="mb-4">
                  <div className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                    {type.label}
                    {list.length > 3 && (
                      <button
                        className="text-xs text-blue-300 underline ml-2 hover:text-blue-400"
                        onClick={() => setCareerModal({ type: type.label, careers: list })}
                        type="button"
                      >
                        더보기 +{list.length - 3}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {preview.map((c) => {
                      // 유튜브 썸네일 생성 로직 추가
                      const ytThumb = getYoutubeThumb(c.video_url || "");
                      
                      return (
                        <div
                          key={c.id}
                          className="rounded-xl bg-white/10 p-3 flex gap-3 items-center shadow-sm cursor-pointer hover:bg-white/20 transition"
                          onClick={() => setSelectedCareer(c)}
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedCareer(c); }}
                          role="button"
                          aria-label="경력 상세 보기"
                        >
                          {ytThumb ? (
                            <img src={ytThumb} alt="영상 썸네일" className="w-20 h-14 rounded-lg object-cover border border-white/20" />
                          ) : c.video_url ? (
                            <span className="text-xs underline text-blue-300">영상보기</span>
                          ) : null}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">{c.title}</div>
                            {c.detail && <div className="text-xs text-gray-200 truncate">{c.detail}</div>}
                            {c.country && <div className="text-xs text-gray-400">국가: {c.country}</div>}
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
        <ArtistContactButton artistName={artist.name_ko || "아티스트"} />
        
        {/* 더보기 모달 - admin 페이지와 동일한 구조로 변경 */}
        {careerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-2xl">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
                onClick={() => setCareerModal(null)}
                aria-label="닫기"
              >
                ×
              </button>
              <div className="text-lg font-bold text-gray-800 mb-4">{careerModal.type} 전체 경력 ({careerModal.careers.length}개)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {careerModal.careers.map((c: ArtistCareer) => {
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

        {/* 영상 상세 모달 - admin 페이지와 동일한 구조로 변경 */}
        {selectedCareer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 relative shadow-2xl flex flex-col items-center max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold z-10"
                onClick={() => setSelectedCareer(null)}
                aria-label="닫기"
              >
                ×
              </button>
              {/* 영상/이미지 */}
              {selectedCareer.video_url && isYoutubeUrl(selectedCareer.video_url) ? (
                <div className="w-full aspect-video mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedCareer.video_url)}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-56 rounded-lg border border-gray-300"
                  />
                </div>
              ) : selectedCareer.video_url ? (
                <div className="w-full mb-4">
                  <img 
                    src={selectedCareer.video_url} 
                    alt="미디어" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-300" 
                    onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }} 
                  />
                </div>
              ) : null}
              {/* 작품 설명 */}
              <div className="w-full text-center">
                <div className="text-lg font-bold text-gray-900 mb-1">{selectedCareer.title}</div>
                {selectedCareer.detail && <div className="text-base text-gray-700 mb-1">{selectedCareer.detail}</div>}
                {selectedCareer.country && <div className="text-sm text-gray-500 mb-1">국가: {selectedCareer.country}</div>}
                {selectedCareer.video_url && !isYoutubeUrl(selectedCareer.video_url) && (
                  <a href={selectedCareer.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 transition-colors">외부 링크로 보기</a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
} 