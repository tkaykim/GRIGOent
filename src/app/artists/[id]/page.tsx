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
  const [careerModal, setCareerModal] = useState<{ career: ArtistCareer | null } | null>(null);

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
      {/* 커리어 타입별 섹션 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">경력사항</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {CAREER_TYPES.map(type => {
            const list = (groupedCareers[type.value] as ArtistCareer[]) || [];
            if (list.length === 0) return null;
            const preview = list.slice(0, 4);
            return (
              <div key={type.value} className="mb-2 bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-semibold text-pink-500">{type.label}</div>
                  {list.length > 4 && (
                    <button
                      className="text-xs text-blue-400 underline hover:text-blue-600 transition-colors"
                      onClick={() => setCareerModal({ career: null })}
                    >
                      펼치기 +{list.length - 4}
                    </button>
                  )}
                </div>
                <div className="grid gap-2">
                  {preview.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{c.title}</span>
                      <span className="text-xs text-gray-500">{c.detail}</span>
                      {c.video_url && (
                        <a 
                          href={c.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 underline hover:text-blue-700 transition-colors"
                        >
                          영상
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <ArtistContactButton artistName={artist.name_ko || "아티스트"} />
      {/* 커리어 상세 모달 */}
      {careerModal && careerModal.career && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setCareerModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 relative shadow-2xl flex flex-col items-center max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold z-10"
              onClick={() => setCareerModal(null)}
              aria-label="닫기"
            >
              ×
            </button>
            {/* 영상/이미지 */}
            {careerModal.career.video_url && isYoutubeUrl(careerModal.career.video_url) ? (
              <div className="w-full aspect-video mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(careerModal.career.video_url)}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-56 rounded-lg border border-gray-300"
                />
              </div>
            ) : careerModal.career.video_url ? (
              <div className="w-full mb-4">
                <img 
                  src={careerModal.career.video_url} 
                  alt="미디어" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-300" 
                  onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }} 
                />
              </div>
            ) : null}
            {/* 작품 설명 */}
            <div className="w-full text-center">
              <div className="text-lg font-bold text-gray-900 mb-1">{careerModal.career.title}</div>
              {careerModal.career.detail && <div className="text-base text-gray-700 mb-1">{careerModal.career.detail}</div>}
              {careerModal.career.country && <div className="text-sm text-gray-500 mb-1">국가: {careerModal.career.country}</div>}
              {careerModal.career.video_url && !isYoutubeUrl(careerModal.career.video_url) && (
                <a href={careerModal.career.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 transition-colors">외부 링크로 보기</a>
              )}
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  );
} 