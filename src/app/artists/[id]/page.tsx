'use client';

import ArtistProfile from "../../../components/ArtistProfile";
import ArtistMediaSlider from "../../../components/ArtistMediaSlider";
import ArtistContactButton from "../../../components/ArtistContactButton";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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

function getYoutubeThumb(url: string): string | null {
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

async function fetchArtistById(id: string) {
  const { data, error } = await supabase
    .from("artists")
    .select("*, artists_careers(*)")
    .eq("id", id)
    .single();
  return data;
}

export default function ArtistDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [artist, setArtist] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [careerModal, setCareerModal] = useState<{ career: unknown } | null>(null);

  useEffect(() => {
    fetchArtistById(id).then(data => {
      setArtist(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <main className="py-10 text-center text-gray-400">불러오는 중...</main>;
  if (!artist) return <main className="py-10 text-center text-red-400">아티스트 정보를 찾을 수 없습니다.</main>;

  // 커리어 타입별 그룹핑
  const careers = Array.isArray((artist as any).artists_careers) ? (artist as any).artists_careers : [];
  const groupedCareers = groupCareersByType(careers);

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">{(artist as any).name_ko} 상세</h1>
      <ArtistProfile artist={artist} />
      <div className="my-8">
        <ArtistMediaSlider media={(artist as any).media || []} />
      </div>
      {/* 커리어 타입별 섹션 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">경력사항</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {CAREER_TYPES.map(type => {
            const list = (groupedCareers[type.value] as any[]) || [];
            if (list.length === 0) return null;
            const preview = list.slice(0, 4);
            return (
              <div key={type.value} className="mb-2 bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-semibold text-pink-500">{type.label}</div>
                  {list.length > 4 && (
                    <button
                      className="text-xs text-blue-400 underline hover:text-blue-600"
                      onClick={() => setCareerModal({ career: null })}
                    >
                      펼치기 +{list.length - 4}
                    </button>
                  )}
                </div>
                <div className="grid gap-2">
                  {preview.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{c.title}</span>
                      <span className="text-xs text-gray-500">{c.detail}</span>
                      {c.video_url && <a href={c.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">영상</a>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <ArtistContactButton artistName={(artist as any).name_ko} />
      {/* 커리어 상세 모달 */}
      {careerModal && careerModal.career && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl flex flex-col items-center">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
              onClick={() => setCareerModal(null)}
              aria-label="닫기"
            >
              ×
            </button>
            {/* 영상/이미지 */}
            {careerModal.career.video_url && (careerModal.career.video_url.includes("youtube.com") || careerModal.career.video_url.includes("youtu.be")) ? (
              <div className="w-full aspect-video mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${(() => {
                    if (careerModal.career.video_url.includes("youtube.com")) {
                      const match = careerModal.career.video_url.match(/v=([\w-]+)/);
                      return match ? match[1] : "";
                    } else if (careerModal.career.video_url.includes("youtu.be")) {
                      const match = careerModal.career.video_url.match(/youtu.be\/([\w-]+)/);
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
            ) : careerModal.career.video_url ? (
              <div className="w-full mb-4">
                <img src={careerModal.career.video_url} alt="미디어" className="w-full h-48 object-cover rounded-lg border border-gray-300" onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }} />
              </div>
            ) : null}
            {/* 작품 설명 */}
            <div className="w-full text-center">
              <div className="text-lg font-bold text-gray-900 mb-1">{careerModal.career.title}</div>
              {careerModal.career.detail && <div className="text-base text-gray-700 mb-1">{careerModal.career.detail}</div>}
              {careerModal.career.country && <div className="text-sm text-gray-500 mb-1">국가: {careerModal.career.country}</div>}
              {careerModal.career.video_url && !careerModal.career.video_url.includes("youtube") && (
                <a href={careerModal.career.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">외부 링크로 보기</a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 