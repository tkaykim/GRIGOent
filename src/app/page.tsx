'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from '../utils/useTranslation';
import Header from '../components/Header';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../utils/supabase';

async function fetchArtists() {
  try {
    console.log('홈화면 아티스트 조회 시작');
    
    // 단일 쿼리로 모든 데이터 조회 (JOIN 사용)
    const { data: artists, error } = await supabase
      .from('users')
      .select(`
        id,
        slug,
        name,
        email,
        role,
        artists!inner(
          id,
          name_ko,
          name_en,
          profile_image,
          artist_type
        )
      `)
      .in('role', ['choreographer', 'partner_choreographer'])
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Error fetching artists:', error);
      return [];
    }

    console.log('아티스트 목록:', artists);

    // 데이터 구조 변환
    const formattedArtists = (artists || []).map((user: any) => ({
      id: user.id,
      slug: user.slug,
      name_ko: user.artists?.name_ko || user.name || '',
      name_en: user.artists?.name_en || '',
      profile_image: user.artists?.profile_image || '',
      artist_type: user.artists?.artist_type || 'main'
    }));

    console.log('포맷된 아티스트 목록:', formattedArtists);
    return formattedArtists;
  } catch (error) {
    console.error('Exception fetching artists:', error);
    return [];
  }
}

export default function Home() {
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [artists, setArtists] = useState<any[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 캐시된 아티스트 데이터
  const [cachedArtists, setCachedArtists] = useState<any[]>([]);

  useEffect(() => {
    // 즉시 로딩 완료로 설정
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

  // 아티스트 데이터 가져오기 - 캐시 활용
  useEffect(() => {
    const loadArtists = async () => {
      // 캐시된 데이터가 있으면 먼저 표시
      if (cachedArtists.length > 0) {
        setArtists(cachedArtists);
        setArtistsLoading(false);
        return; // 캐시된 데이터가 있으면 새로 조회하지 않음
      }
      
      try {
        setArtistsLoading(true);
        const data = await fetchArtists();
        setArtists(data);
        setCachedArtists(data); // 캐시 업데이트
      } catch (error) {
        console.error('Exception while fetching artists:', error);
      } finally {
        setArtistsLoading(false);
      }
    };

    loadArtists();
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
        <div className="relative z-10 text-center transition-all duration-1000 opacity-100 translate-y-0">
          <h1 className="text-8xl md:text-9xl font-black tracking-tight mb-8 uppercase leading-none">
            <span className="block text-white">{t('main_title_line1')}</span>
            <span className="block text-white/80">{t('main_title_line2')}</span>
            <span className="block text-white">{t('main_title_line3')}</span>
          </h1>
          
          <div className="w-32 h-1 bg-white/30 mb-8 mx-auto"></div>
          
          <p className="text-xl md:text-2xl font-light tracking-widest mb-12 opacity-80 max-w-2xl mx-auto">
            {t('main_subtitle')}
          </p>
          
          {/* 로그인한 사용자를 위한 환영 메시지 */}
          {user && (
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <p className="text-lg font-medium">
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

      {/* Contact Button - Fixed Right */}
      <div className="fixed top-1/2 right-8 transform -translate-y-1/2 z-10">
        <button 
          onClick={() => router.push('/contact')}
          className="relative px-8 py-4 bg-white text-black text-base font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-full shadow-lg overflow-hidden group"
        >
          {/* 움직이는 라이트 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          
          <span className="relative">CONTACT</span>
        </button>
      </div>

      {/* 스크롤 인디케이터 - 고정 위치 */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* About Section */}
      <section className="relative py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center transition-all duration-1000 opacity-100 translate-y-0">
            <div>
              <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
                <span className="block text-white">{t('no_excuses_line1')}</span>
                <span className="block text-white/80">{t('no_excuses_line2')}</span>
              </h2>
              <p className="text-xl md:text-2xl font-light leading-relaxed opacity-80">
                {t('about_description')}
              </p>
            </div>
            <div className="space-y-8">
              <div className="border-l-4 border-white/30 pl-8">
                <h3 className="text-4xl font-black mb-2">100+</h3>
                <p className="text-lg opacity-60">{t('choreography_projects')}</p>
              </div>
              <div className="border-l-4 border-white/30 pl-8">
                <h3 className="text-4xl font-black mb-2">1000+</h3>
                <p className="text-lg opacity-60">{t('dancer_recruitments')}</p>
              </div>
              <div className="border-l-4 border-white/30 pl-8">
                <h3 className="text-4xl font-black mb-2">50+</h3>
                <p className="text-lg opacity-60">{t('satisfied_clients')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Artists Section */}
      <section className="relative py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20 transition-all duration-1000 opacity-100 translate-y-0">
            <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
              OUR ARTISTS
            </h2>
            <p className="text-xl md:text-2xl font-light opacity-80 max-w-3xl mx-auto">
              Meet our talented artists who bring passion and creativity to every performance.
            </p>
          </div>

          {artistsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square rounded-xl bg-white/10 mb-3"></div>
                  <div className="h-4 bg-white/10 rounded mb-1"></div>
                  <div className="h-3 bg-white/5 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : artists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">등록된 아티스트가 없습니다.</p>
              <p className="text-white/40 text-sm mt-2">관리자 페이지에서 아티스트를 등록해주세요.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 transition-all duration-1000 delay-300 opacity-100 translate-y-0">
                {artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artists/${artist.id}`}
                    className="group cursor-pointer hover:scale-105 transition-transform duration-300"
                    aria-label={`${artist.name_ko} 상세보기`}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-white/10 mb-3">
                      <img
                        src={artist.profile_image || '/window.svg'}
                        alt={artist.name_ko}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/window.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                      {/* 호버 오버레이 */}
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white text-sm font-bold uppercase tracking-widest">VIEW</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white mb-1 truncate">
                        {artist.name_ko}
                      </h3>
                      {artist.name_en && (
                        <p className="text-xs text-white/60 truncate">
                          {artist.name_en}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <button
                  onClick={() => router.push('/artists')}
                  className="bg-white text-black px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-full"
                >
                  VIEW ALL ARTISTS
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Recent Projects Section - No-Mercy 스타일 */}
      <section className="relative py-32 bg-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20 transition-all duration-1000 opacity-100 translate-y-0">
            <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
              RECENT PROJECTS
            </h2>
            <p className="text-xl md:text-2xl font-light opacity-80 max-w-3xl mx-auto">
              From dynamic choreography to groundbreaking dance experiences, if it moves, we're all about it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 delay-300 opacity-100 translate-y-0">
            <ProjectCard 
              title="LEENAN"
              category="CHOREOGRAPHY"
              year="2024"
              image="/api/placeholder/400/300"
            />
            <ProjectCard 
              title="YUMEKI"
              category="DANCER RECRUITMENT"
              year="2024"
              image="/api/placeholder/400/300"
            />
            <ProjectCard 
              title="K-POP STARS"
              category="PERFORMANCE"
              year="2024"
              image="/api/placeholder/400/300"
            />
            <ProjectCard 
              title="GLOBAL TOUR"
              category="EVENT"
              year="2024"
              image="/api/placeholder/400/400"
            />
            <ProjectCard 
              title="MUSIC VIDEO"
              category="PRODUCTION"
              year="2024"
              image="/api/placeholder/400/300"
            />
            <ProjectCard 
              title="FESTIVAL"
              category="LIVE"
              year="2024"
              image="/api/placeholder/400/300"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20 transition-all duration-1000 opacity-100 translate-y-0">
            <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
              {t('our_services')}
            </h2>
            <p className="text-xl md:text-2xl font-light opacity-80 max-w-3xl mx-auto">
              {t('services_description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-300 opacity-100 translate-y-0">
            <ServiceCard 
              title={t('choreography')} 
              desc={t('choreography_desc')} 
              number="01"
            />
            <ServiceCard 
              title={t('dancer_recruitment')} 
              desc={t('dancer_recruitment_desc')} 
              number="02"
            />
            <ServiceCard 
              title={t('performance_booking')} 
              desc={t('performance_booking_desc')} 
              number="03"
            />
          </div>
        </div>
      </section>

      {/* 무한 스크롤 브랜드 섹션 - No-Mercy 스타일 */}
      <section className="relative py-20 bg-white/5 overflow-hidden">
        <div className="transition-all duration-1000 opacity-100 translate-y-0">
          <div className="text-center mb-12">
            <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
              {t('brand_experience')}
            </h2>
            <p className="text-xl md:text-2xl font-light opacity-80">
              {t('brand_experience_desc')}
            </p>
          </div>
          
          {/* 무한 스크롤 텍스트 */}
          <div className="relative overflow-hidden">
            <div className="flex whitespace-nowrap animate-scroll">
              <div className="flex space-x-16 text-2xl md:text-4xl font-bold tracking-widest opacity-60">
                <span>WORK WITH US</span>
                <span>•</span>
                <span>K-POP</span>
                <span>•</span>
                <span>J-POP</span>
                <span>•</span>
                <span>C-POP</span>
                <span>•</span>
                <span>GLOBAL</span>
                <span>•</span>
                <span>ADVERTISING</span>
                <span>•</span>
                <span>MUSIC VIDEO</span>
                <span>•</span>
                <span>CONCERT</span>
                <span>•</span>
                <span>FESTIVAL</span>
                <span>•</span>
                <span>WORK WITH US</span>
                <span>•</span>
                <span>K-POP</span>
                <span>•</span>
                <span>J-POP</span>
                <span>•</span>
                <span>C-POP</span>
                <span>•</span>
                <span>GLOBAL</span>
                <span>•</span>
                <span>ADVERTISING</span>
                <span>•</span>
                <span>MUSIC VIDEO</span>
                <span>•</span>
                <span>CONCERT</span>
                <span>•</span>
                <span>FESTIVAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="transition-all duration-1000 opacity-100 translate-y-0">
            <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
              {t('get_in_touch')}
            </h2>
            <p className="text-xl md:text-2xl font-light opacity-80 mb-12">
              {t('get_in_touch_desc')}
            </p>
            <button 
              onClick={() => router.push('/contact')}
              className="bg-white text-black px-16 py-6 text-xl font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300"
            >
              {t('work_with_us')}
            </button>
          </div>
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

