import { supabase } from './supabase';
import { useState, useCallback, useEffect } from 'react';

// 아티스트 데이터 타입 정의
export interface Artist {
  id: string;
  slug?: string;
  name_ko: string;
  name_en?: string;
  profile_image?: string;
  artist_type: string;
  careers?: Career[];
}

export interface Career {
  id: string;
  type: string;
  title: string;
  detail?: string;
  country?: string;
  video_url?: string;
  featured_position?: number;
}

// 향상된 캐시 관리 시스템
class ArtistCache {
  private cache: Map<string, { data: Artist[]; timestamp: number; loading: boolean }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30분으로 증가 (더 오래 캐시)
  private loadingPromises: Map<string, Promise<Artist[]>> = new Map();

  set(key: string, data: Artist[]) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      loading: false
    });
  }

  get(key: string): Artist[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  isLoaded(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && !cached.loading;
  }

  setLoading(key: string, loading: boolean) {
    const cached = this.cache.get(key);
    if (cached) {
      cached.loading = loading;
    } else {
      this.cache.set(key, {
        data: [],
        timestamp: Date.now(),
        loading
      });
    }
  }

  setLoadingPromise(key: string, promise: Promise<Artist[]>) {
    this.loadingPromises.set(key, promise);
  }

  getLoadingPromise(key: string): Promise<Artist[]> | undefined {
    return this.loadingPromises.get(key);
  }

  clearLoadingPromise(key: string) {
    this.loadingPromises.delete(key);
  }

  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // 캐시 상태 확인
  getCacheStatus(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return 'none';
    if (cached.loading) return 'loading';
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) return 'expired';
    return 'valid';
  }
}

const artistCache = new ArtistCache();

// 단순화된 아티스트 조회 함수 - 개선된 버전
export async function fetchArtistsSimple(): Promise<Artist[]> {
  const cacheKey = 'artists-simple';
  
  // 이미 로딩 중인 요청이 있다면 기다림
  const existingPromise = artistCache.getLoadingPromise(cacheKey);
  if (existingPromise) {
    console.log('이미 진행 중인 아티스트 로딩 요청 대기...');
    return existingPromise;
  }

  // 캐시 확인
  const cached = artistCache.get(cacheKey);
  if (cached) {
    console.log('캐시된 아티스트 데이터 사용');
    return cached;
  }

  // 새로운 로딩 시작
  const loadingPromise = performArtistFetch();
  artistCache.setLoadingPromise(cacheKey, loadingPromise);
  artistCache.setLoading(cacheKey, true);

  try {
    const result = await loadingPromise;
    artistCache.set(cacheKey, result);
    return result;
  } finally {
    artistCache.setLoading(cacheKey, false);
    artistCache.clearLoadingPromise(cacheKey);
  }
}

// 실제 데이터 조회 로직을 분리 - artists 테이블에서만 조회하되 slug는 users 테이블에서 가져오기
async function performArtistFetch(): Promise<Artist[]> {
  try {
    console.log('아티스트 데이터 조회 시작...');
    
    // artists 테이블에서 필요한 필드만 조회
    const { data: artists, error } = await supabase
      .from('artists')
      .select(`
        id,
        name_ko,
        name_en,
        profile_image,
        artist_type,
        user_id
      `)
      .in('artist_type', ['choreographer', 'partner_choreographer'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('아티스트 조회 오류:', error);
      throw new Error(`아티스트 조회 실패: ${error.message}`);
    }

    if (!artists || artists.length === 0) {
      console.log('조회된 아티스트가 없습니다.');
      return [];
    }

    // user_id로 users 테이블에서 slug 조회 (배치 처리)
    const userIds = artists.map(artist => artist.user_id).filter(Boolean);
    let userSlugs: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, slug')
        .in('id', userIds);
      
      if (!userError && users) {
        userSlugs = users.reduce((acc, user) => {
          acc[user.id] = user.slug || user.id;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // 데이터 변환 및 검증
    const transformedArtists: Artist[] = artists
      .filter(artist => artist.name_ko && artist.name_ko.trim() !== '') // 유효한 이름이 있는 것만
      .map(artist => ({
        id: artist.user_id || artist.id,
        slug: userSlugs[artist.user_id] || artist.id, // users 테이블의 slug 사용
        name_ko: artist.name_ko,
        name_en: artist.name_en || '',
        profile_image: artist.profile_image || '',
        artist_type: artist.artist_type || 'main'
      }));

    console.log(`${transformedArtists.length}명의 아티스트 데이터 조회 완료`);
    console.log('아티스트 데이터 샘플:', transformedArtists.slice(0, 2));
    return transformedArtists;
  } catch (error) {
    console.error('아티스트 조회 중 예외 발생:', error);
    throw error;
  }
}

// 상세 아티스트 정보 조회 (최적화된 버전)
export async function fetchArtistDetail(slug: string): Promise<Artist | null> {
  const cacheKey = `artist-detail-${slug}`;
  
  // 캐시 확인
  const cached = artistCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached[0];
  }

  try {
    console.log(`아티스트 상세 정보 조회: ${slug}`);
    
    // 1. 먼저 users 테이블에서 user_id 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      console.error('사용자 조회 오류:', userError);
      return null;
    }

    // 2. artists 테이블에서 아티스트 정보 조회
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select(`
        id,
        name_ko,
        name_en,
        profile_image,
        artist_type,
        bio,
        youtube_links
      `)
      .eq('user_id', user.id)
      .single();

    if (artistError || !artistData) {
      console.error('아티스트 정보 조회 오류:', artistError);
      return null;
    }

    // 3. 경력 정보 조회
    const { data: careers, error: careerError } = await supabase
      .from('artists_careers')
      .select('*')
      .eq('artist_id', artistData.id)
      .order('created_at', { ascending: false });

    if (careerError) {
      console.error('경력 조회 오류:', careerError);
    }

    const artist: Artist = {
      id: user.id,
      slug: slug,
      name_ko: artistData.name_ko || '',
      name_en: artistData.name_en || '',
      profile_image: artistData.profile_image || '',
      artist_type: artistData.artist_type || 'main',
      careers: careers || []
    };

    // 캐시에 저장
    artistCache.set(cacheKey, [artist]);
    
    return artist;
  } catch (error) {
    console.error('아티스트 상세 조회 중 예외 발생:', error);
    return null;
  }
}

// 캐시 무효화
export function invalidateArtistCache() {
  artistCache.clear();
  console.log('아티스트 캐시 무효화됨');
}

// 캐시 상태 확인
export function getArtistCacheStatus() {
  return {
    simple: artistCache.getCacheStatus('artists-simple'),
    loading: artistCache.getLoadingPromise('artists-simple') !== undefined
  };
}

// 단순화된 에러 재시도 로직 (빠른 실패)
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 2, // 재시도 횟수 감소
  delay: number = 500 // 지연 시간 감소
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`시도 ${i + 1}/${maxRetries} 실패:`, error);
      
      if (i < maxRetries - 1) {
        // 단순한 지연 (지수 백오프 제거)
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// 아티스트 데이터 프리로딩 (선택적)
export function preloadArtists() {
  // 백그라운드에서 미리 로딩
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      fetchArtistsSimple().catch(error => {
        console.log('프리로딩 실패 (정상):', error);
      });
    }, 1000);
  }
} 

// 아티스트 데이터 관리를 위한 커스텀 훅
export function useArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [networkStatus, setNetworkStatus] = useState<boolean>(true);

  const loadArtists = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // 네트워크 상태 확인
      const isOnline = await checkNetworkStatus();
      setNetworkStatus(isOnline);
      
      if (!isOnline) {
        setError('네트워크 연결을 확인해주세요.');
        setLoading(false);
        return;
      }
      
      // 캐시 상태 확인
      const cacheStatus = getArtistCacheStatus();
      console.log('캐시 상태:', cacheStatus);
      
      // 강제 새로고침이 아니고 캐시가 유효하면 즉시 사용
      if (!forceRefresh && cacheStatus.simple === 'valid') {
        const cachedData = await fetchArtistsSimple();
        setArtists(cachedData);
        setLastFetch(Date.now());
        
        setLoading(false);
        return;
      }
      
      // 단순화된 재시도 로직과 함께 아티스트 데이터 조회
      const data = await fetchWithRetry(fetchArtistsSimple, 2, 500);
      setArtists(data);
      setLastFetch(Date.now());
      
    } catch (error) {
      console.error('아티스트 로딩 실패:', error);
      setError(getErrorMessage(error));
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshArtists = useCallback(() => {
    return loadArtists(true);
  }, [loadArtists]);

  // 컴포넌트 마운트 시 자동으로 아티스트 데이터 로드
  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  // 네트워크 상태 모니터링
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    artists,
    loading,
    error,
    lastFetch,
    networkStatus,
    loadArtists,
    refreshArtists
  };
} 

// 이미지 프리로딩 유틸리티
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// 아티스트 이미지들 일괄 프리로딩
export async function preloadArtistImages(artists: Artist[]): Promise<void> {
  const imagePromises = artists
    .filter(artist => artist.profile_image)
    .map(artist => preloadImage(artist.profile_image!))
    .slice(0, 10); // 최대 10개까지만 프리로딩

  try {
    await Promise.allSettled(imagePromises);
    console.log('아티스트 이미지 프리로딩 완료');
  } catch (error) {
    console.log('이미지 프리로딩 중 일부 실패 (정상):', error);
  }
}

// 네트워크 상태 확인
export function checkNetworkStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('navigator' in window && 'onLine' in navigator) {
      resolve(navigator.onLine);
    } else {
      // 폴백: 간단한 ping 테스트
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  });
}

// 향상된 에러 메시지 생성
export function getErrorMessage(error: any): string {
  if (error?.message?.includes('network')) {
    return '네트워크 연결을 확인해주세요.';
  }
  if (error?.message?.includes('timeout')) {
    return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
  }
  if (error?.message?.includes('rate limit')) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }
  return '아티스트 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.';
}

// 캐시 상태 모니터링
export function monitorCacheHealth() {
  const status = getArtistCacheStatus();
  console.log('캐시 상태 모니터링:', status);
  
  // 캐시가 만료되었거나 로딩 중이면 백그라운드에서 새로고침
  if (status.simple === 'expired' && !status.loading) {
    console.log('캐시 만료됨 - 백그라운드에서 새로고침');
    preloadArtists();
  }
}

// 주기적 캐시 상태 확인 (선택적)
export function startCacheMonitoring(intervalMs: number = 60000) {
  if (typeof window !== 'undefined') {
    setInterval(monitorCacheHealth, intervalMs);
  }
} 