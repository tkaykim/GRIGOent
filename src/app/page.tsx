'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleEnterClick = () => {
    router.push('/artists');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* 메인 로고/타이틀 */}
        <div className="mb-12">
          <h1 className="text-7xl md:text-8xl font-thin tracking-wider mb-4 select-none">
            GRIGOENT
          </h1>
          <div className="w-32 h-0.5 bg-white mx-auto opacity-60"></div>
        </div>

        {/* 서브 텍스트 */}
        <div className="mb-16">
          <p className="text-lg md:text-xl font-light tracking-wide opacity-70 mb-2">
            Artist Management
          </p>
          <p className="text-sm md:text-base font-light tracking-widest opacity-50">
            CREATIVE • AUTHENTIC • PROFESSIONAL
          </p>
        </div>

        {/* 엔터 버튼 */}
        <div className="space-y-6">
          <button
            onClick={handleEnterClick}
            className="group relative border border-white/30 px-8 py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 ease-in-out"
          >
            <span className="relative z-10">Enter</span>
            <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
          
          <div className="text-xs opacity-40 tracking-wide">
            Press Enter to explore artists
          </div>
        </div>

        {/* 하단 장식 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-px h-12 bg-white opacity-20"></div>
        </div>
      </div>

      {/* 키보드 Enter 키 지원 */}
      <div
        className="fixed inset-0 z-0"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleEnterClick();
          }
        }}
        tabIndex={0}
      />
    </div>
  );
}
