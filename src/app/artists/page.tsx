'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "../../components/Header";
import { useTranslation } from "../../utils/useTranslation";
import { type Artist, type Career } from "../../utils/artists";
import ArtistSection from "../../components/ArtistSection";

const CAREER_TYPES = [
  { value: "choreo", label: "choreo" },
  { value: "broadcast", label: "broadcast" },
  { value: "event", label: "event" },
  { value: "ad", label: "ad" },
  { value: "dancer", label: "dancer" },
  { value: "workshop", label: "workshop" },
];

function ArtistCard({ artist, onShowCareers }: { artist: Artist, onShowCareers: (artist: Artist) => void }) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  
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
    if (lang === 'ko' && artist.name_ko) return artist.name_ko;
    if (lang === 'en' && artist.name_en) return artist.name_en;
    return artist.name_ko || t('artists');
  };
  
  // 역할에 따른 표시 텍스트
  const getRoleDisplay = (artistType: string) => {
    switch (artistType) {
      case 'choreographer':
        return t('choreographer');
      case 'partner_choreographer':
        return t('partner_choreographer');
      default:
        return artistType;
    }
  };
  
  const handleArtistClick = () => {
    const url = `/artists/${artist.slug}`;
    console.log('아티스트 클릭:', url);
    router.push(url);
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
      <div className="relative mb-4" onClick={handleArtistClick}>
        {artist.profile_image ? (
          <img
            src={artist.profile_image}
            alt={getArtistName()}
            className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/window.svg';
            }}
          />
        ) : (
          <div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <span className="text-white/40 text-4xl">🎭</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 rounded-lg"></div>
      </div>
      
      <div onClick={handleArtistClick}>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/80 transition-colors">
          {getArtistName()}
        </h3>
        {artist.name_en && (
          <p className="text-white/60 mb-2">{artist.name_en}</p>
        )}
        <p className="text-sm text-white/40 uppercase tracking-wider mb-4">
          {getRoleDisplay(artist.artist_type)}
        </p>
      </div>

      {/* 대표 경력 표시 */}
      <div className="space-y-2">
        {(featuredCareers.length > 0 ? featuredCareers : fallbackCareers).map((career, index) => (
          <div key={career?.id || index} className="flex items-center justify-between text-sm">
            <span className="text-white/60 capitalize">
              {career?.type} {career?.featured_position ? `#${career.featured_position}` : ''}
            </span>
            <span className="text-white/80 font-medium truncate ml-2">
              {career?.title}
            </span>
          </div>
        ))}
      </div>

      {/* 경력 보기 버튼 */}
      {artist.careers && artist.careers.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowCareers(artist);
          }}
          className="mt-4 w-full px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-colors"
        >
          경력 보기
        </button>
      )}
    </div>
  );
}

// 경력 모달 컴포넌트
function CareerModal({ artist, isOpen, onClose }: { 
  artist: Artist | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const { t, lang } = useTranslation();

  if (!isOpen || !artist) return null;

  const getArtistName = () => {
    if (lang === 'ko' && artist.name_ko) return artist.name_ko;
    if (lang === 'en' && artist.name_en) return artist.name_en;
    return artist.name_ko || t('artists');
  };

  // 경력을 타입별로 그룹화
  const careersByType = (artist.careers || []).reduce((acc, career) => {
    if (!acc[career.type]) {
      acc[career.type] = [];
    }
    acc[career.type]!.push(career);
    return acc;
  }, {} as Record<string, Career[]>);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black/95 border border-white/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {getArtistName()} - 경력
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {Object.keys(careersByType).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(careersByType).map(([type, careers]) => (
                <div key={type}>
                  <h3 className="text-lg font-bold text-white mb-3 capitalize">
                    {type} ({careers?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {careers?.map((career) => (
                      <div key={career.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1">
                              {career.title}
                              {career.featured_position && (
                                <span className="ml-2 text-yellow-400 text-sm">
                                  대표경력 #{career.featured_position}
                                </span>
                              )}
                            </h4>
                            {career.detail && (
                              <p className="text-white/60 text-sm mb-2">
                                {career.detail}
                              </p>
                            )}
                            {career.country && (
                              <p className="text-white/40 text-xs">
                                {career.country}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-center py-8">
              등록된 경력이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtistListPage() {
  const { t } = useTranslation();
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showCareerModal, setShowCareerModal] = useState(false);



  const handleShowCareers = (artist: Artist) => {
    setSelectedArtist(artist);
    setShowCareerModal(true);
  };

  const handleCloseModal = () => {
    setShowCareerModal(false);
    setSelectedArtist(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header showBackButton={true} />
      
      <ArtistSection 
        title="OUR ARTISTS"
        subtitle="Meet our talented artists who bring passion and creativity to every performance."
        maxItems={50}
        showViewAll={false}
        showCareerModal={true}
        onShowCareers={handleShowCareers}
      />

      {/* 경력 모달 */}
      <CareerModal
        artist={selectedArtist}
        isOpen={showCareerModal}
        onClose={() => setShowCareerModal(false)}
      />
    </div>
  );
} 