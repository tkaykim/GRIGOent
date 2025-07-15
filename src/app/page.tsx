'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from '../utils/useTranslation';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Home() {
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 즉시 로딩 완료로 설정
    setIsLoaded(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // 스크롤 이벤트 리스너 추가
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // 아티스트 데이터 가져오기
  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name_ko, name_en, profile_image")
        .order("created_at", { ascending: false })
        .limit(12); // 최대 12명만 표시
      
      if (data) {
        setArtists(data);
      }
    };

    fetchArtists();
  }, []);

  // 로딩 상태 확인
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl font-bold">LOADING...</div>
      </div>
    );
  }

  // 메뉴 닫기 함수
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 메뉴 항목 클릭 핸들러
  const handleMenuClick = (page: string) => {
    closeMenu();
    
    switch (page) {
      case 'home':
        // 이미 홈페이지에 있으므로 아무것도 하지 않음
        break;
      case 'about':
        alert('About Us page is under development.');
        break;
      case 'works':
        alert('Works page is under development.');
        break;
      case 'artists':
        router.push('/artists');
        break;
      case 'contact':
        router.push('/contact');
        break;
      default:
        break;
    }
  };

  // 유튜브 영상 ID
  const YOUTUBE_ID = 'ktWrP16ZpTk';

  return (
    <div ref={containerRef} className="relative bg-black text-white overflow-x-hidden">
      {/* 햄버거 메뉴 버튼 */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="relative w-10 h-10 flex flex-col justify-center items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white mt-1 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white mt-1 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
      </div>

      {/* 언어 전환 버튼 - 비활성화됨 */}
      {/* 
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-white font-medium tracking-wider hover:bg-white/20 transition-all duration-300 text-sm uppercase"
        >
          {lang === 'ko' ? 'EN' : 'KO'}
        </button>
      </div>
      */}

      {/* 사이드 메뉴 */}
      <div className={`fixed inset-0 z-40 transition-all duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* 배경 오버레이 */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={closeMenu}
        ></div>
        
        {/* 메뉴 패널 */}
        <div className={`absolute top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/20 transform transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 h-full flex flex-col">
            {/* 메뉴 헤더 */}
            <div className="mb-12">
              <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">GRIGOENT</h2>
              <div className="w-12 h-0.5 bg-white/30"></div>
            </div>

            {/* 메뉴 항목들 */}
            <nav className="flex-1">
              <ul className="space-y-8">
                <li>
                  <button 
                    onClick={() => handleMenuClick('home')}
                    className="text-3xl font-bold uppercase tracking-widest text-white hover:text-white/80 transition-colors duration-300 block w-full text-left"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleMenuClick('about')}
                    className="text-3xl font-bold uppercase tracking-widest text-white hover:text-white/80 transition-colors duration-300 block w-full text-left"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleMenuClick('artists')}
                    className="text-3xl font-bold uppercase tracking-widest text-white hover:text-white/80 transition-colors duration-300 block w-full text-left"
                  >
                    Artists
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleMenuClick('works')}
                    className="text-3xl font-bold uppercase tracking-widest text-white hover:text-white/80 transition-colors duration-300 block w-full text-left"
                  >
                    Works
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleMenuClick('contact')}
                    className="text-3xl font-bold uppercase tracking-widest text-white hover:text-white/80 transition-colors duration-300 block w-full text-left"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </nav>

            {/* 메뉴 푸터 */}
            <div className="mt-auto">
              <div className="border-t border-white/20 pt-6">
                <p className="text-sm text-white/60 uppercase tracking-widest">
                  © 2024 GRIGOENT
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - No-Mercy 스타일 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 비디오 백그라운드 */}
        <div className="absolute inset-0 w-full h-full z-0">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${YOUTUBE_ID}&modestbranding=1&showinfo=0&rel=0&enablejsapi=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            title="GRIGOENT Background"
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
        </div>
      </section>

      {/* Contact Button - Fixed Right */}
      <div className="fixed top-1/2 right-8 transform -translate-y-1/2 z-10">
        <button 
          onClick={() => router.push('/contact')}
          className="bg-white text-black px-6 py-3 text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-full shadow-lg"
        >
          CONTACT
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 transition-all duration-1000 delay-300 opacity-100 translate-y-0">
            {artists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => router.push(`/artists/${artist.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white/10 mb-3">
                  <img
                    src={artist.profile_image || '/window.svg'}
                    alt={artist.name_ko}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/window.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
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
              </div>
            ))}
          </div>

          {artists.length > 0 && (
            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/artists')}
                className="bg-white text-black px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-all duration-300 rounded-full"
              >
                VIEW ALL ARTISTS
              </button>
            </div>
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
