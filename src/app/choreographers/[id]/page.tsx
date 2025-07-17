'use client';

import { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import { useParams } from 'next/navigation';
import { supabase } from '../../../utils/supabase';

interface Choreographer {
  id: string;
  name_ko: string;
  name_en?: string;
  bio?: string;
  profile_image?: string;
  youtube_links?: string[];
}

interface Career {
  id: string;
  type: string;
  title: string;
  detail?: string;
  country?: string;
  video_url?: string;
  created_at: string;
}

const CAREER_TYPES = {
  choreo: "안무제작",
  broadcast: "방송출연",
  event: "행사출연",
  ad: "광고출연",
  dancer: "댄서참여",
  workshop: "워크샵"
};

export default function ChoreographerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [choreographer, setChoreographer] = useState<Choreographer | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChoreographerData();
    }
  }, [id]);

  const fetchChoreographerData = async () => {
    try {
      // UUID인지 slug인지 확인
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let query = supabase
        .from('artists')
        .select('*, users!inner(*)')
        .eq('artist_type', 'choreographer');
      
      if (isUUID) {
        // UUID로 조회
        query = query.eq('id', id);
      } else {
        // slug로 조회
        query = query.eq('users.slug', id);
      }
      
      const { data: profileData, error: profileError } = await query.single();

      if (profileError) {
        console.error('전속안무가 프로필 조회 오류:', profileError);
        return;
      }

      setChoreographer(profileData);

      // 경력 조회
      const { data: careersData, error: careersError } = await supabase
        .from('artists_careers')
        .select('*')
        .eq('artist_id', id)
        .order('created_at', { ascending: false });

      if (careersError) {
        console.error('경력 조회 오류:', careersError);
      } else {
        setCareers(careersData || []);
      }
    } catch (error) {
      console.error('전속안무가 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="전속안무가 상세" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">로딩 중...</div>
        </div>
      </>
    );
  }

  if (!choreographer) {
    return (
      <>
        <Header title="전속안무가 상세" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-2xl font-bold">전속안무가를 찾을 수 없습니다.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={choreographer.name_ko} />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* 프로필 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* 프로필 이미지 */}
            <div className="aspect-square rounded-lg overflow-hidden bg-white/10">
              {choreographer.profile_image ? (
                <img
                  src={choreographer.profile_image}
                  alt={choreographer.name_ko}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/40 text-2xl">이미지 없음</span>
                </div>
              )}
            </div>

            {/* 프로필 정보 */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{choreographer.name_ko}</h1>
                {choreographer.name_en && (
                  <p className="text-2xl text-white/60">{choreographer.name_en}</p>
                )}
              </div>

              {choreographer.bio && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">소개</h2>
                  <p className="text-white/80 leading-relaxed">{choreographer.bio}</p>
                </div>
              )}

              {choreographer.youtube_links && choreographer.youtube_links.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">유튜브 링크</h2>
                  <div className="space-y-2">
                    {choreographer.youtube_links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-400 hover:underline"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 경력 섹션 */}
          {careers.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8">경력</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {careers.map((career) => (
                  <div key={career.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-white/60">
                        {CAREER_TYPES[career.type as keyof typeof CAREER_TYPES] || career.type}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{career.title}</h3>
                    {career.detail && (
                      <p className="text-white/80 mb-3">{career.detail}</p>
                    )}
                    {career.country && (
                      <p className="text-sm text-white/60 mb-2">국가: {career.country}</p>
                    )}
                    {career.video_url && (
                      <a
                        href={career.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-blue-400 hover:underline"
                      >
                        영상 보기 →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 