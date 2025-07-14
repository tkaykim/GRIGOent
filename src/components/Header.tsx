'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Menu, X, Home, Users, Settings } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHamburger?: boolean;
}

export default function Header({ title, showBackButton = true, showHamburger = true }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

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
    setIsMenuOpen(false);
  };

  // 홈 페이지에서는 헤더를 숨김
  if (pathname === '/') {
    return null;
  }

  const menuItems = [
    { icon: Home, label: '홈', path: '/' },
    { icon: Users, label: '아티스트', path: '/artists' },
    { icon: Settings, label: '관리자', path: '/admin/artists' },
  ];

  return (
    <>
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-4">
          {/* 뒤로가기 버튼 */}
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* 제목 */}
          <div className="flex-1 text-center">
            <h1 className="text-white text-lg font-medium tracking-wide">
              {title || 'GRIGOENT'}
            </h1>
          </div>

          {/* 햄버거 버튼 */}
          {showHamburger && (
            <button
              onClick={handleMenuToggle}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="메뉴"
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </header>

      {/* 헤더 높이만큼 여백 */}
      <div className="h-16" />

      {/* 햄버거 메뉴 오버레이 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-80 h-full bg-black/95 backdrop-blur-sm border-l border-white/10">
            {/* 메뉴 헤더 */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
              <h2 className="text-white text-lg font-medium">메뉴</h2>
              <button
                onClick={handleMenuToggle}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="메뉴 닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* 메뉴 아이템들 */}
            <nav className="p-4 space-y-2">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="text-sm tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 하단 정보 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <div className="text-center text-white/50 text-xs tracking-wide">
                <p>GRIGOENT</p>
                <p>Artist Management</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}