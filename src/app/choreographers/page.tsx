'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';
import { supabase } from '../../utils/supabase';

interface Choreographer {
  id: string;
  name_ko: string;
  name_en?: string;
  bio?: string;
  profile_image?: string;
  youtube_links?: string[];
  careers?: Career[];
}

interface Career {
  id: string;
  title: string;
  type: string;
  featured_position?: number;
}

export default function ChoreographersPage() {
  const [choreographers, setChoreographers] = useState<Choreographer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChoreographers();
  }, []);

  const fetchChoreographers = async () => {
    try {
      // 전속안무가 목록 조회
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .eq('artist_type', 'choreographer')
        .order('created_at', { ascending: false });

      if (artistsError) {
        console.error('전속안무가 목록 조회 오류:', artistsError);
        return;
      }

      // 각 전속안무가의 경력 조회
      const choreographersWithCareers = await Promise.all(
        (artistsData || []).map(async (artist) => {
          const { data: careersData } = await supabase
            .from('artists_careers')
            .select('id, title, type, featured_position')
            .eq('artist_id', artist.id)
            .order('created_at', { ascending: false });

          return {
            ...artist,
            careers: careersData || []
          };
        })
      );

      setChoreographers(choreographersWithCareers);
    } catch (error) {
      console.error('전속안무가 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 대표작 또는 최근 작업 가져오기
  const getFeaturedWork = (choreographer: Choreographer) => {
    if (!choreographer.careers || choreographer.careers.length === 0) {
      return null;
    }

    // 대표 경력이 있는지 확인 (featured_position이 1-4인 것)
    const featuredCareer = choreographer.careers.find(c => 
      c.featured_position && c.featured_position >= 1 && c.featured_position <= 4
    );

    if (featuredCareer) {
      return featuredCareer;
    }

    // 대표 경력이 없으면 최근 작업 반환
    return choreographer.careers[0];
  };

  if (loading) {
    return (
      <>
        <Header title="전속안무가" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">로딩 중...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="전속안무가" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">전속안무가</h1>
            <p className="text-white/60">그리고 엔터테인먼트의 전속안무가들을 소개합니다.</p>
          </div>

          {choreographers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/60 text-lg">등록된 전속안무가가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {choreographers.map((choreographer) => {
                const featuredWork = getFeaturedWork(choreographer);
                
                return (
                  <Link
                    key={choreographer.id}
                    href={`/choreographers/${choreographer.id}`}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors"
                  >
                    <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-white/10">
                      {choreographer.profile_image ? (
                        <img
                          src={choreographer.profile_image}
                          alt={choreographer.name_ko}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white/40">이미지 없음</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{choreographer.name_ko}</h3>
                    {choreographer.name_en && (
                      <p className="text-white/60 mb-2">{choreographer.name_en}</p>
                    )}
                    {featuredWork ? (
                      <div className="text-white/80 text-sm">
                        <span className="font-semibold">대표작:</span> {featuredWork.title}
                      </div>
                    ) : choreographer.bio ? (
                      <p className="text-white/80 text-sm line-clamp-3">
                        {choreographer.bio}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 