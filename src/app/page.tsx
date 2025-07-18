'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from '../utils/useTranslation';
import Header from '../components/Header';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';

import ArtistSection from '../components/ArtistSection';

export default function Home() {
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 즉시 로딩 완료로 설정 (아티스트 섹션은 별도로 로딩)
    setIsLoaded(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // 스크롤 이벤트 리스너 추가 (throttled)
    if (typeof window !== 'undefined') {
      let ticking = false;
      const throttledScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      };
      
      window.addEventListener('scroll', throttledScroll, { passive: true });
      return () => window.removeEventListener('scroll', throttledScroll);
    }
  }, []);

  // 로딩 상태 확인
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl font-bold">LOADING...</div>
      </div>
    );
  }

  // 유튜브 영상 ID
  const YOUTUBE_ID = 'ktWrP16ZpTk';

  return (
    <div ref={containerRef} className="relative bg-black text-white overflow-x-hidden">
      <Header showBackButton={false} />

      {/* Hero Section - No-Mercy 스타일 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 비디오 백그라운드 */}
        <div className="absolute inset-0 w-full h-full z-0">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${YOUTUBE_ID}&modestbranding=1&showinfo=0&rel=0&enablejsapi=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&playsinline=1&disablekb=1`}
            title="그리고 엔터테인먼트 Background"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            frameBorder={0}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.4) grayscale(0.6)' }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* 메인 타이틀 - No-Mercy 스타일 */}
        <div className="relative z-10 text-center transition-all duration-1000 opacity-100 translate-y-0 px-4">
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6 md:mb-8 uppercase leading-none">
            <span className="block text-white">{t('main_title_line1')}</span>
            <span className="block text-white/80">{t('main_title_line2')}</span>
            <span className="block text-white">{t('main_title_line3')}</span>
          </h1>
          
          <div className="w-24 md:w-32 h-1 bg-white/30 mb-6 md:mb-8 mx-auto"></div>
          
          <p className="text-lg sm:text-xl md:text-2xl font-light tracking-widest mb-8 md:mb-12 opacity-80 max-w-2xl mx-auto px-4">
            {t('main_subtitle')}
          </p>
          
          {/* 로그인한 사용자를 위한 환영 메시지 */}
          {user && (
            <div className="mt-6 md:mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mx-4">
              <p className="text-base md:text-lg font-medium">
                안녕하세요, {user.name || user.email}님! 👋
              </p>
              <p className="text-sm opacity-80 mt-1">
                {user.role === 'admin' ? '관리자' : 
                 user.role === 'main_choreographer' ? '전속안무가' :
                 user.role === 'partner_choreographer' ? '파트너안무가' : '클라이언트'}로 로그인되었습니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Button - 모바일 반응형 위치 조정 */}
      <div className="fixed top-1/2 right-4 md:right-8 transform -translate-y-1/2 z-10">
        <button 
          onClick={() => router.push('/contact')}
          className="relative px-4 md:px-8 py-3 md:py-4 bg-white text-black text-sm md:text-base font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-full shadow-lg overflow-hidden group"
        >
          {/* 움직이는 라이트 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          
          <span className="relative">CONTACT</span>
        </button>
      </div>

      {/* 스크롤 인디케이터 - 고정 위치 */}
      <div className="fixed bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* About Section */}
      <section className="relative py-16 md:py-32 bg-black">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center transition-all duration-1000 opacity-100 translate-y-0">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 md:mb-8 uppercase">
                <span className="block text-white">{t('no_excuses_line1')}</span>
                <span className="block text-white/80">{t('no_excuses_line2')}</span>
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl font-light leading-relaxed opacity-80">
                {t('about_description')}
              </p>
            </div>
            <div className="space-y-6 md:space-y-8">
              <div className="border-l-4 border-white/30 pl-6 md:pl-8">
                <h3 className="text-3xl md:text-4xl font-black mb-2">100+</h3>
                <p className="text-base md:text-lg opacity-60">{t('choreography_projects')}</p>
              </div>
              <div className="border-l-4 border-white/30 pl-6 md:pl-8">
                <h3 className="text-3xl md:text-4xl font-black mb-2">1000+</h3>
                <p className="text-base md:text-lg opacity-60">{t('dancer_recruitments')}</p>
              </div>
              <div className="border-l-4 border-white/30 pl-6 md:pl-8">
                <h3 className="text-3xl md:text-4xl font-black mb-2">50+</h3>
                <p className="text-base md:text-lg opacity-60">{t('satisfied_clients')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Artists Section */}
      <ArtistSection 
        title="OUR ARTISTS"
        subtitle="Meet our talented artists who bring passion and creativity to every performance."
        maxItems={8}
        showViewAll={true}
      />

      {/* Works Section */}
      <section className="relative py-16 md:py-32 bg-black">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 md:mb-8 uppercase">
              <span className="block text-white">OUR</span>
              <span className="block text-white">WORKS</span>
            </h2>
            <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">
              Discover our latest projects and creative collaborations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <ProjectCard 
              title="Dance Performance 2024"
              category="Performance"
              year="2024"
              image="/api/placeholder/400/300"
            />
            <ProjectCard 
              title="Music Video Production"
              category="Video"
              year="2024"
              image="/api/placeholder/400/300"
            />
            <ProjectCard 
              title="Corporate Event"
              category="Event"
              year="2024"
              image="/api/placeholder/400/300"
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-16 md:py-32 bg-black">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 md:mb-8 uppercase">
            <span className="block text-white">GET</span>
            <span className="block text-white">IN TOUCH</span>
          </h2>
          <p className="text-lg md:text-xl opacity-60 mb-8 md:mb-12 max-w-2xl mx-auto">
            Ready to bring your vision to life? Let's create something amazing together.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-black font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-full"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ title, desc, number }: { title: string; desc: string; number: string }) {
  return (
    <div className="group relative bg-white/5 border border-white/10 p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500">
      <div className="absolute top-4 right-4 text-6xl font-black opacity-20 group-hover:opacity-40 transition-opacity duration-500">
        {number}
      </div>
      <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">{title}</h3>
      <p className="text-lg opacity-60 leading-relaxed">{desc}</p>
    </div>
  );
}

function ProjectCard({ title, category, year, image }: { title: string; category: string; year: string; image: string }) {
  return (
    <div className="group relative bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-500">
      {/* 썸네일 이미지 */}
      <div className="relative h-64 bg-gradient-to-br from-white/10 to-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">{title}</h3>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium uppercase tracking-widest opacity-80">{category}</span>
            <span className="text-sm font-bold opacity-60">{year}</span>
          </div>
        </div>
      </div>
      
      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
        <div className="text-center">
          <span className="text-lg font-bold uppercase tracking-widest">VIEW PROJECT</span>
        </div>
      </div>
    </div>
  );
}

function BrandCard({ name }: { name: string }) {
  return (
    <div className="group relative bg-white/5 border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-500 text-center">
      <h3 className="text-xl font-bold uppercase tracking-widest group-hover:text-white/90 transition-colors duration-300">
        {name}
      </h3>
    </div>
  );
}

