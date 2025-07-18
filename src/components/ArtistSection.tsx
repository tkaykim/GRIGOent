'use client';
import React from 'react';
import Link from 'next/link';
import { useArtists, type Artist } from '../utils/artists';

interface ArtistSectionProps {
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  maxItems?: number;
  className?: string;
  showCareerModal?: boolean;
  onShowCareers?: (artist: Artist) => void;
  children?: React.ReactNode;
}

export default function ArtistSection({ 
  title = "OUR ARTISTS", 
  subtitle = "Meet our talented artists who bring passion and creativity to every performance.",
  showViewAll = true,
  maxItems = 8,
  className = "",
  showCareerModal = false,
  onShowCareers,
  children
}: ArtistSectionProps) {
  const { artists, loading, error, retryCount, refreshArtists } = useArtists();

  // 개선된 로딩 스켈레톤 컴포넌트
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {Array.from({ length: Math.min(maxItems, 8) }).map((_, index) => (
        <div key={index} className="bg-white/5 rounded-lg p-4 md:p-6 animate-pulse">
          <div className="w-full h-48 md:h-56 bg-white/10 rounded-lg mb-4"></div>
          <div className="h-4 bg-white/10 rounded mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-2/3"></div>
          <div className="h-3 bg-white/10 rounded w-1/2 mt-2"></div>
        </div>
      ))}
    </div>
  );

  // 개선된 에러 상태 컴포넌트
  const ErrorState = () => (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <p className="text-red-400 text-lg mb-2">{error}</p>
        {retryCount > 0 && (
          <p className="text-white/60 text-sm">
            재시도 {retryCount}회 완료
          </p>
        )}
      </div>
      <button 
        onClick={refreshArtists}
        className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? '로딩 중...' : '다시 시도'}
      </button>
    </div>
  );

  // 아티스트 카드 컴포넌트
  const ArtistCard = ({ artist }: { artist: Artist }) => {
    const getArtistName = () => {
      // 언어 설정에 따라 이름 반환 (기본값은 한국어)
      return artist.name_ko || 'Unknown Artist';
    };

    const getRoleDisplay = (artistType: string) => {
      switch (artistType) {
        case 'choreographer':
          return '전속안무가';
        case 'partner_choreographer':
          return '파트너안무가';
        default:
          return artistType;
      }
    };

    return (
      <div className="group bg-white/5 rounded-lg p-4 md:p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
        <Link 
          href={`/artists/${artist.slug}`}
          className="block"
        >
          <div className="relative mb-4">
            {artist.profile_image ? (
              <img
                src={artist.profile_image}
                alt={getArtistName()}
                className="w-full h-48 md:h-56 object-cover rounded-lg"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/window.svg';
                }}
              />
            ) : (
              <div className="w-full h-48 md:h-56 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white/40 text-2xl">🎭</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 rounded-lg"></div>
          </div>
          <h3 className="text-lg md:text-xl font-bold mb-2 text-white group-hover:text-white/80 transition-colors">
            {getArtistName()}
          </h3>
          {artist.name_en && (
            <p className="text-sm md:text-base text-white/60 mb-2">
              {artist.name_en}
            </p>
          )}
          <p className="text-sm text-white/40 uppercase tracking-wider">
            {getRoleDisplay(artist.artist_type)}
          </p>
        </Link>
        
        {/* 경력 보기 버튼 (showCareerModal이 true일 때만 표시) */}
        {showCareerModal && artist.careers && artist.careers.length > 0 && onShowCareers && (
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
  };

  return (
    <section className={`relative py-16 md:py-32 bg-black ${className}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-20 transition-all duration-1000 opacity-100 translate-y-0">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 md:mb-8 uppercase">
            <span className="block text-white">{title.split(' ')[0]}</span>
            <span className="block text-white">{title.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* 커스텀 콘텐츠 또는 아티스트 그리드 */}
        {children ? (
          children
        ) : loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState />
        ) : artists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {artists.slice(0, maxItems).map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
            {showViewAll && artists.length > maxItems && (
              <div className="text-center mt-12">
                <Link 
                  href="/artists"
                  className="inline-block px-8 py-4 bg-white text-black font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-lg"
                >
                  모든 아티스트 보기
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">등록된 아티스트가 없습니다.</p>
          </div>
        )}
      </div>
  </section>
);
} 