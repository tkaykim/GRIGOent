'use client';
import Header from '../../components/Header';
import { useTranslation } from '../../utils/useTranslation';

export default function WorksPage() {
  const { t, lang } = useTranslation();

  const works = [
    {
      id: 1,
      title: lang === 'ko' ? "K-POP 안무 제작" : "K-POP Choreography",
      category: lang === 'ko' ? "안무제작" : "Choreography",
      year: "2024",
      description: lang === 'ko' 
        ? "유명 K-POP 그룹의 메인 타이틀 곡 안무 제작"
        : "Main title song choreography for famous K-POP group",
      image: "/window.svg"
    },
    {
      id: 2,
      title: lang === 'ko' ? "뮤직비디오 댄서 섭외" : "Music Video Dancer Recruitment",
      category: lang === 'ko' ? "댄서섭외" : "Dancer Recruitment",
      year: "2024",
      description: lang === 'ko' 
        ? "대형 엔터테인먼트 뮤직비디오 촬영을 위한 댄서 섭외"
        : "Dancer recruitment for large entertainment music video filming",
      image: "/window.svg"
    },
    {
      id: 3,
      title: lang === 'ko' ? "콘서트 안무 제작" : "Concert Choreography",
      category: lang === 'ko' ? "안무제작" : "Choreography",
      year: "2023",
      description: lang === 'ko' 
        ? "월드투어 콘서트를 위한 대규모 안무 제작"
        : "Large-scale choreography for world tour concert",
      image: "/window.svg"
    },
    {
      id: 4,
      title: lang === 'ko' ? "방송 프로그램 댄서 섭외" : "TV Show Dancer Recruitment",
      category: lang === 'ko' ? "댄서섭외" : "Dancer Recruitment",
      year: "2023",
      description: lang === 'ko' 
        ? "인기 방송 프로그램의 댄서 섭외 및 연출"
        : "Dancer recruitment and direction for popular TV shows",
      image: "/window.svg"
    },
    {
      id: 5,
      title: lang === 'ko' ? "광고 안무 제작" : "Commercial Choreography",
      category: lang === 'ko' ? "안무제작" : "Choreography",
      year: "2023",
      description: lang === 'ko' 
        ? "대형 브랜드 광고를 위한 안무 제작"
        : "Choreography for major brand commercials",
      image: "/window.svg"
    },
    {
      id: 6,
      title: lang === 'ko' ? "뮤지컬 댄서 섭외" : "Musical Dancer Recruitment",
      category: lang === 'ko' ? "댄서섭외" : "Dancer Recruitment",
      year: "2023",
      description: lang === 'ko' 
        ? "뮤지컬 공연을 위한 전문 댄서 섭외"
        : "Professional dancer recruitment for musical performances",
      image: "/window.svg"
    }
  ];

  return (
    <>
      <Header title="Works" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
              WORKS
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-80 max-w-3xl mx-auto">
              {lang === 'ko' 
                ? "그리고 엔터테인먼트의 대표적인 프로젝트들을 소개합니다."
                : "Introducing representative projects of 그리고 엔터테인먼트."
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {works.map((work) => (
              <div key={work.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300">
                <div className="aspect-video bg-white/5 flex items-center justify-center">
                  <img 
                    src={work.image} 
                    alt={work.title}
                    className="w-16 h-16 opacity-50"
                    onError={e => { (e.target as HTMLImageElement).src = '/window.svg'; }}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white/60 uppercase tracking-widest">
                      {work.category}
                    </span>
                    <span className="text-sm text-white/40">
                      {work.year}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">
                    {work.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    {work.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4">
                {lang === 'ko' ? "더 많은 프로젝트" : "More Projects"}
              </h2>
              <p className="text-lg opacity-80 mb-6">
                {lang === 'ko' 
                  ? "그리고 엔터테인먼트와 함께 새로운 프로젝트를 시작해보세요."
                  : "Start a new project with 그리고 엔터테인먼트."
                }
              </p>
              <button className="px-8 py-3 bg-white text-black font-bold hover:bg-white/90 transition-colors rounded">
                {lang === 'ko' ? "문의하기" : "Contact Us"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 