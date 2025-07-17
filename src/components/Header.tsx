'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Menu, X, Home, Users, Settings, Phone, User } from 'lucide-react';
import { useTranslation } from '../utils/useTranslation';
import { useAuth } from "./AuthProvider";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHamburger?: boolean;
}

export default function Header({ title, showBackButton = true, showHamburger = true }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang, setLang } = useTranslation();
  const { user, signOut, loading: authLoading } = useAuth();

  useEffect(() => {
    // 메뉴가 열렸을 때 스크롤 방지
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    
    // 모바일 메뉴가 열려있을 때만 닫기
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'About Us', path: '/about' },
    { icon: Users, label: 'Artists', path: '/artists' },
    { icon: Users, label: 'Works', path: '/works' },
    { icon: Phone, label: 'Contact', path: '/contact' },
  ];

  // 로그인한 사용자에게만 Mypage 메뉴 추가
  const allMenuItems = user ? [
    ...menuItems,
    { icon: User, label: 'Mypage', path: '/dashboard' }
  ] : menuItems;

  return (
    <>
      {/* PC 네비게이션 바 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* 왼쪽 - 로고 및 뒤로가기 */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* 뒤로가기 버튼 (홈페이지가 아닐 때만) */}
              {showBackButton && pathname !== '/' && (
                <button
                  onClick={handleBack}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} className="md:w-5 md:h-5" />
                </button>
              )}

              {/* 로고 */}
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/')}
                  className="text-white text-xl md:text-2xl font-bold tracking-wider hover:text-white/80 transition-colors"
                >
                  GRIGO
                </button>
              </div>
            </div>

            {/* 중앙 - PC 메뉴 (lg 이상에서만 표시) */}
            <nav className="hidden lg:flex items-center gap-8">
              {allMenuItems.map((item, index) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${
                      isActive 
                        ? 'text-white' 
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* 오른쪽 - 언어 전환 및 햄버거 메뉴 */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* 로그인/회원가입/로그아웃 버튼 - 모바일에서 숨김 */}
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                    <span className="text-white text-sm">
                      {user.name || user.email}
                    </span>
                    <button
                      onClick={async () => { 
                        try {
                          console.log('Header 로그아웃 시작...');
                          await signOut();
                          console.log('Header 로그아웃 완료');
                          router.push("/"); 
                        } catch (error) {
                          console.error('Header 로그아웃 중 오류:', error);
                          // 에러가 발생해도 홈페이지로 이동
                          router.push("/");
                        }
                      }}
                      className="px-4 py-1 rounded bg-white text-black font-bold hover:bg-white/80 transition-colors"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/auth/login")}
                      className="px-4 py-1 rounded bg-white text-black font-bold hover:bg-white/80 transition-colors"
                    >
                      로그인
                    </button>
                    <button
                      onClick={() => router.push("/auth/signup")}
                      className="px-4 py-1 rounded bg-black text-white font-bold border border-white ml-2 hover:bg-white hover:text-black transition-colors"
                    >
                      회원가입
                    </button>
                  </>
                )}
              </div>

              {/* 언어 전환 버튼 */}
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold border border-white/20 text-white/80 hover:bg-white/10 transition-colors ${lang === 'ko' ? 'bg-white/20 text-white' : ''}`}
                  onClick={() => setLang('ko')}
                  aria-label="Korean"
                >
                  KR
                </button>
                <span className="text-white/40 text-xs md:text-sm font-bold">|</span>
                <button
                  className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold border border-white/20 text-white/80 hover:bg-white/10 transition-colors ${lang === 'en' ? 'bg-white/20 text-white' : ''}`}
                  onClick={() => setLang('en')}
                  aria-label="English"
                >
                  EN
                </button>
              </div>

              {/* 햄버거 메뉴 버튼 (모바일에서만) */}
              {showHamburger && (
                <button
                  onClick={handleMenuToggle}
                  className="md:hidden relative w-8 h-8 md:w-10 md:h-10 flex flex-col justify-center items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
                  aria-label="Menu"
                >
                  <span className={`block w-5 md:w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block w-5 md:w-6 h-0.5 bg-white mt-1 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block w-5 md:w-6 h-0.5 bg-white mt-1 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 헤더 높이만큼 여백 */}
      <div className="h-16 md:h-20" />

      {/* 사이드 메뉴 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md">
          <div className="absolute top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/20">
            <div className="p-6 md:p-8 h-full flex flex-col">
              {/* 메뉴 헤더 */}
              <div className="mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white mb-2">GRIGO</h2>
                <div className="w-12 h-0.5 bg-white/30"></div>
              </div>

              {/* 로그인/회원가입 버튼 - 모바일 메뉴에서만 표시 */}
              <div className="mb-6 md:mb-8">
                {user ? (
                  <div className="space-y-4">
                    <div className="text-white/60 text-base md:text-lg">
                      {user.name || user.email}
                    </div>
                    <button 
                      onClick={async () => { 
                        try {
                          console.log('사이드 메뉴 로그아웃 시작...');
                          const result = await signOut();
                          console.log('사이드 메뉴 로그아웃 결과:', result);
                          router.push("/"); 
                          setIsMenuOpen(false);
                        } catch (error) {
                          console.error('사이드 메뉴 로그아웃 중 오류:', error);
                          router.push("/");
                          setIsMenuOpen(false);
                        }
                      }}
                      className="w-full px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        router.push("/auth/login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors"
                    >
                      로그인
                    </button>
                    <button 
                      onClick={() => {
                        router.push("/auth/signup");
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-6 py-3 bg-transparent text-white font-bold border border-white rounded-lg hover:bg-white hover:text-black transition-colors"
                    >
                      회원가입
                    </button>
                  </div>
                )}
              </div>

              {/* 메뉴 항목들 */}
              <nav className="flex-1">
                <ul className="space-y-6 md:space-y-8">
                  {allMenuItems.map((item, index) => {
                    const isActive = pathname === item.path;
                    return (
                      <li key={index}>
                        <button 
                          onClick={() => handleNavigation(item.path)}
                          className={`text-2xl md:text-3xl font-bold uppercase tracking-widest transition-colors duration-300 block w-full text-left ${
                            isActive 
                              ? 'text-white' 
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* 언어 전환 - 모바일 메뉴 하단 */}
              <div className="mt-auto pt-6 border-t border-white/20">
                <div className="flex items-center gap-4">
                  <span className="text-white/60 text-sm">Language:</span>
                  <div className="flex items-center gap-2">
                    <button
                      className={`px-3 py-1 rounded text-sm font-bold border border-white/20 text-white/80 hover:bg-white/10 transition-colors ${lang === 'ko' ? 'bg-white/20 text-white' : ''}`}
                      onClick={() => setLang('ko')}
                    >
                      KR
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm font-bold border border-white/20 text-white/80 hover:bg-white/10 transition-colors ${lang === 'en' ? 'bg-white/20 text-white' : ''}`}
                      onClick={() => setLang('en')}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 메뉴 외부 클릭 시 닫기 */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
}