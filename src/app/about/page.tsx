'use client';
import Header from '../../components/Header';
import { useTranslation } from '../../utils/useTranslation';

export default function AboutPage() {
  const { t, lang } = useTranslation();

  return (
    <>
      <Header title="About Us" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-8 uppercase">
              ABOUT US
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-80 max-w-3xl mx-auto">
              {lang === 'ko' 
                ? "그리고 엔터테인먼트는 글로벌 댄스 컴퍼니로, 안무제작부터 댄서섭외까지 모든 것을 담당합니다."
                : "그리고 엔터테인먼트 is a global dance company that handles everything from choreography to dancer recruitment."
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <h2 className="text-4xl font-black mb-6">
                {lang === 'ko' ? "우리의 미션" : "Our Mission"}
              </h2>
              <p className="text-lg opacity-80 leading-relaxed">
                {lang === 'ko' 
                  ? "최고의 안무가들과 댄서들을 연결하여 세계적인 공연을 만들어갑니다. 우리는 창의성과 전문성을 바탕으로 고객의 비전을 현실로 구현합니다."
                  : "We connect the best choreographers and dancers to create world-class performances. We realize our clients' visions based on creativity and expertise."
                }
              </p>
            </div>
            <div className="space-y-8">
              <div className="border-l-4 border-white/30 pl-8">
                <h3 className="text-3xl font-black mb-2">100+</h3>
                <p className="text-lg opacity-60">
                  {lang === 'ko' ? "안무 프로젝트" : "Choreography Projects"}
                </p>
              </div>
              <div className="border-l-4 border-white/30 pl-8">
                <h3 className="text-3xl font-black mb-2">1000+</h3>
                <p className="text-lg opacity-60">
                  {lang === 'ko' ? "댄서 섭외" : "Dancer Recruitments"}
                </p>
              </div>
              <div className="border-l-4 border-white/30 pl-8">
                <h3 className="text-3xl font-black mb-2">50+</h3>
                <p className="text-lg opacity-60">
                  {lang === 'ko' ? "만족한 고객" : "Satisfied Clients"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-black mb-8">
              {lang === 'ko' ? "서비스" : "Services"}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">
                  {lang === 'ko' ? "안무제작" : "Choreography"}
                </h3>
                <p className="opacity-80">
                  {lang === 'ko' 
                    ? "전문 안무가들이 고객의 요구사항에 맞는 맞춤형 안무를 제작합니다."
                    : "Professional choreographers create customized choreography according to client requirements."
                  }
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">
                  {lang === 'ko' ? "댄서섭외" : "Dancer Recruitment"}
                </h3>
                <p className="opacity-80">
                  {lang === 'ko' 
                    ? "다양한 스타일과 경험을 가진 댄서들을 프로젝트에 맞게 섭외합니다."
                    : "We recruit dancers with various styles and experiences for your projects."
                  }
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">
                  {lang === 'ko' ? "아티스트 매니지먼트" : "Artist Management"}
                </h3>
                <p className="opacity-80">
                  {lang === 'ko' 
                    ? "아티스트의 경력 관리와 프로모션을 전담합니다."
                    : "We handle artist career management and promotion."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 