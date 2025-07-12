"use client";

import React from "react";
import ArtistMediaSlider from "./ArtistMediaSlider";
import ArtistSection from "./ArtistSection";
import ArtistContactButton from "./ArtistContactButton";

const artist = {
  name: "유메키 (Yumeki)",
  media: [
    { type: "image" as const, url: "https://search.pstatic.net/common?src=https://ssl.pstatic.net/sstatic/search/pc/img/2023/img_star_default.png&type=f640_360" },
    // 실제 프로필 이미지/영상 추가 가능
  ],
  about: `K-POP 대표 안무가, 댄서, 안무 트레이너. ITZY, K/DA, SHINee, 퍼플키스, 더보이즈, 카이, 온앤오프, 야오천, 텐, PRODUCE 101 JAPAN, NCT 127, TWS, MAZZEL, ME:I, ENHYPEN, Kep1er, TXT 등 수많은 아티스트의 안무 제작 및 퍼포먼스 디렉팅.\n\nMnet 스트릿 맨 파이터, 보이즈플래닛 2 등 방송 출연 및 전국투어, 광고, 콘서트 등 다양한 활동.`,
  choreoHistory: [
    "ITZY - WANNABE", "K/DA - MORE", "스위트홈 X BewhY - 나란히", "SHINee - Heart Attack, I Really Want You", "퍼플키스 - Ponzona", "원어스 - Black Mirror", "퍼플키스 - ZOMBIE", "백현 - Addicted", "더보이즈 - MAVERICK", "카이 - Peaches prologue film", "온앤오프 - Goosebumps", "야오천 - 醒·Lithops", "원어스 - 덤벼, ERASE ME", "텐 - New Heroes", "킬라(Killa) - Shalala", "PRODUCE 101 JAPAN THE GIRLS - LEAP HIGH! ~내일로, 힘차게~, AtoZ, Popcorn", "NCT 127 - Fact Check (불가사의; 不可思議)", "TWS - Oh Mymy : 7s", "MAZZEL - Waterfall", "ME:I - Click", "NCT WISH - Song Bird", "ENHYPEN - Brought The Heat Back", "ME:I - Hi-Five", "ARrC - dummy, S&S (sour and sweet)", "Kep1er - TIPI-TAP", "ODD YOUTH - THAT'S ME", "TWS - 마지막 축제", "ZEROBASEONE - NOW OR NEVER", "NouerA - N.I.N (New is Now)", "ME:I - MUSE", "ODD YOUTH - I Like You", "TWS - 마음 따라 뛰는 건 멋지지 않아?", "투모로우바이투게더 - Love Language", "LiKE LEGEND - YOU ARE SPECiAL"
  ],
  broadcast: [
    "Mnet 스트릿 맨 파이터", "Mnet 보이즈플래닛 2"
  ],
  event: [
    "Mnet 스트릿 맨 파이터 콘서트 전국투어"
  ],
  dancer: [
    "SHINee - Don't Call Me"
  ],
  ads: [
    { title: "삼성전자 갤럭시 S25 광고", url: "https://www.youtube.com/watch?v=5lHHAxyXI_g" },
    { title: "LG GRAM S25 광고", url: "https://www.youtube.com/watch?v=dpeAk8_oRNs" }
  ],
  sns: [
    { name: "YouTube", url: "https://www.youtube.com/@tamzin_choi" },
    { name: "Instagram", url: "https://www.instagram.com/tamzin_choi/" }
  ]
};

interface ArtistProfileProps {
  artist: unknown;
}

const fallbackArtist = artist;

function getYoutubeThumb(url: string): string | null {
  try {
    const videoId = url.split('v=')[1];
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  } catch (e) {
    console.error("Error getting YouTube thumbnail:", e);
  }
  return null;
}

function getMainImage(artist: unknown): string {
  // 대표 미디어(유튜브 썸네일 > media > profile_image > fallback)
  const youtube = Array.isArray(artist as any) ? (artist as any).find((l: string) => l.includes("youtube.com") || l.includes("youtu.be")) : null;
  if (youtube) {
    const thumb = getYoutubeThumb(youtube);
    if (thumb) return thumb;
  }
  if (Array.isArray(artist as any) && (artist as any).media.length > 0) {
    return (artist as any).media[0].url;
  }
  if ((artist as any).profile_image) return (artist as any).profile_image;
  return "/window.svg";
}

const ArtistProfile: React.FC<ArtistProfileProps> = ({ artist }) => {
  const data = artist || fallbackArtist;
  const mainImage = getMainImage(data);
  return (
    <div className="relative w-full min-h-[420px] flex flex-col items-center justify-center mb-8">
      {/* 배경 이미지 + 블러 + 오버레이 */}
      <div className="absolute inset-0 z-0">
        <img
          src={mainImage}
          alt={(data as any).name}
          className="w-full h-full object-cover scale-110 blur-md brightness-75"
          onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>
      {/* 글래스모피즘 카드 */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mt-12 mb-8">
        <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4">
          <img
            src={(data as any).profile_image || mainImage}
            alt={(data as any).name}
            className="w-28 h-28 rounded-full object-cover border-4 border-white/40 shadow-lg bg-gray-800 -mt-20 mb-2"
            onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
          />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 text-white drop-shadow-lg">{(data as any).name_ko || (data as any).name}</h1>
          {((data as any).sns && (data as any).sns.length > 0) && (
            <div className="flex gap-4 mt-1">
              {((data as any).sns as any[]).map((sns: any) => (
                <a key={sns.name} href={sns.url} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                  <span className="sr-only">{sns.name}</span>
                  {sns.name === "YouTube" ? (
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M23.498 6.186a2.997 2.997 0 0 0-2.11-2.116C19.2 3.5 12 3.5 12 3.5s-7.2 0-9.388.57A2.997 2.997 0 0 0 .502 6.186C0 8.38 0 12 0 12s0 3.62.502 5.814a2.997 2.997 0 0 0 2.11 2.116C4.8 20.5 12 20.5 12 20.5s7.2 0 9.388-.57a2.997 2.997 0 0 0 2.11-2.116C24 15.62 24 12 24 12s0-3.62-.502-5.814ZM9.545 16.02V7.98l7.273 4.02-7.273 4.02Z"/></svg>
                  ) : (
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5Zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm6.25.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>
                  )}
                </a>
              ))}
            </div>
          )}
          {((data as any).about && (data as any).about.length > 0) && (
            <p className="whitespace-pre-line leading-relaxed text-lg text-white/90 text-center mt-2">{(data as any).about}</p>
          )}
        </div>
      </div>
      {/* ABOUT */}
      {((data as any).about && (data as any).about.length > 0) && (
        <ArtistSection title="ABOUT">
          <p className="whitespace-pre-line leading-relaxed text-lg">{(data as any).about}</p>
        </ArtistSection>
      )}
      {/* 안무 제작 이력 */}
      {((data as any).choreoHistory && (data as any).choreoHistory.length > 0) && (
        <ArtistSection title="안무 제작 이력">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-base">
            {((data as any).choreoHistory as any[]).map((item: any, i: number) => (
              <li key={i} className="list-disc list-inside">{item}</li>
            ))}
          </ul>
        </ArtistSection>
      )}
      {/* 방송 출연 이력 */}
      {((data as any).broadcast && (data as any).broadcast.length > 0) && (
        <ArtistSection title="방송 출연 이력">
          <ul className="flex flex-wrap gap-2 text-base">
            {((data as any).broadcast as unknown[]).map((item: unknown, i: number) => {
              const broadcast = item as string;
              return (
                <li key={i} className="bg-white/10 rounded px-3 py-1">{broadcast}</li>
              );
            })}
          </ul>
        </ArtistSection>
      )}
      {/* 행사 출연 이력 */}
      {((data as any).event && (data as any).event.length > 0) && (
        <ArtistSection title="행사 출연 이력">
          <ul className="flex flex-wrap gap-2 text-base">
            {((data as any).event as unknown[]).map((item: unknown, i: number) => {
              const event = item as string;
              return (
                <li key={i} className="bg-white/10 rounded px-3 py-1">{event}</li>
              );
            })}
          </ul>
        </ArtistSection>
      )}
      {/* 댄서 출연 이력 */}
      {((data as any).dancer && (data as any).dancer.length > 0) && (
        <ArtistSection title="댄서 출연 이력">
          <ul className="flex flex-wrap gap-2 text-base">
            {((data as any).dancer as unknown[]).map((item: unknown, i: number) => {
              const dancer = item as string;
              return (
                <li key={i} className="bg-white/10 rounded px-3 py-1">{dancer}</li>
              );
            })}
          </ul>
        </ArtistSection>
      )}
      {/* 광고 출연 이력 */}
      {((data as any).ads && (data as any).ads.length > 0) && (
        <ArtistSection title="광고 출연 이력">
          <ul className="flex flex-col gap-2 text-base">
            {((data as any).ads as unknown[]).map((ad: unknown, i: number) => {
              const a = ad as { title: string; url: string };
              return (
                <li key={i}>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-pink-400 transition-colors">{a.title}</a>
                </li>
              );
            })}
          </ul>
        </ArtistSection>
      )}
      {/* 섭외 문의 버튼 */}
      <ArtistContactButton />
    </div>
  );
};

export default ArtistProfile; 