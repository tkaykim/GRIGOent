'use client';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black/90 backdrop-blur-sm border-t border-white/10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 연락처 정보 */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold tracking-wide mb-4">
              연락처
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-white/60" />
                <span className="text-white/80 text-sm">
                  +82) 02-6229-9229
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-white/60" />
                <span className="text-white/80 text-sm">
                  contact@grigoent.co.kr
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-white/60 mt-0.5" />
                <span className="text-white/80 text-sm leading-relaxed">
                  서울특별시 마포구 성지3길 55, 3층
                </span>
              </div>
            </div>
          </div>

          {/* 회사 정보 */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold tracking-wide mb-4">
              회사 정보
            </h3>
            <div className="space-y-2 text-white/60 text-sm">
              <p>GRIGOENT</p>
              <p>Artist Management</p>
              <p>엔터테인먼트 아티스트 매니지먼트</p>
            </div>
          </div>

          {/* 서비스 */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold tracking-wide mb-4">
              서비스
            </h3>
            <div className="space-y-2 text-white/60 text-sm">
              <p>아티스트 매니지먼트</p>
              <p>이벤트 기획</p>
              <p>프로모션</p>
            </div>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <div className="text-center text-white/40 text-xs tracking-wide">
            <p>&copy; 2024 GRIGOENT. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
} 