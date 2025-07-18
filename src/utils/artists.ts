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
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분으로 단축 (더 빠른 갱신)
  private loadingPromises: Map<string, Promise<Artist[]>> = new Map();
  private lastError: { message: string; timestamp: number } | null = null;
  private readonly ERROR_COOLDOWN = 10 * 1000; // 10초 에러 쿨다운

  set(key: string, data: Artist[]) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      loading: false
    });
    this.lastError = null; // 성공 시 에러 상태 초기화
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

  setError(message: string) {
    this.lastError = { message, timestamp: Date.now() };
  }

  canRetry(): boolean {
    if (!this.lastError) return true;
    return Date.now() - this.lastError.timestamp > this.ERROR_COOLDOWN;
  }

  getLastError(): string | null {
    if (!this.lastError || !this.canRetry()) return null;
    return this.lastError.message;
  }

  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
    this.lastError = null;
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

// 단순하고 확실한 아티스트 조회 함수
export async function fetchArtistsSimple(): Promise<Artist[]> {
  const cacheKey = 'artists-simple';
  
  // 에러 쿨다운 확인
  if (!artistCache.canRetry()) {
    const lastError = artistCache.getLastError();
    if (lastError) {
      throw new Error(lastError);
    }
  }
  
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
  const loadingPromise = performSimpleArtistFetch();
  artistCache.setLoadingPromise(cacheKey, loadingPromise);
  artistCache.setLoading(cacheKey, true);

  try {
    const result = await loadingPromise;
    artistCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    artistCache.setError(errorMessage);
    throw error;
  } finally {
    artistCache.setLoading(cacheKey, false);
    artistCache.clearLoadingPromise(cacheKey);
  }
}

// 간단하고 확실한 아티스트 데이터 조회
async function performSimpleArtistFetch(): Promise<Artist[]> {
  try {
    console.log('아티스트 데이터 조회 시작...');
    
    // 1. artists 테이블에서 아티스트 정보 조회
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
      .limit(20);

    if (error) {
      console.error('아티스트 조회 오류:', error);
      throw new Error(`아티스트 조회 실패: ${error.message}`);
    }

    if (!artists || artists.length === 0) {
      console.log('조회된 아티스트가 없습니다.');
      return [];
    }

    // 2. user_id로 users 테이블에서 slug 조회 (배치 처리)
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

    // 3. 데이터 변환 및 검증
    const transformedArtists: Artist[] = artists
      .filter(artist => artist.name_ko && artist.name_ko.trim() !== '')
      .map(artist => ({
        id: artist.user_id || artist.id,
        slug: userSlugs[artist.user_id] || artist.user_id || artist.id,
        name_ko: artist.name_ko,
        name_en: artist.name_en || '',
        profile_image: artist.profile_image || '',
        artist_type: artist.artist_type || 'main'
      }));

    console.log(`${transformedArtists.length}명의 아티스트 데이터 조회 완료`);
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

// 캐시 상태 확인 함수
export function getArtistCacheStatus() {
  return {
    simple: artistCache.getCacheStatus('artists-simple')
  };
}

// 아티스트 데이터 프리로딩 (선택적)
export function preloadArtists() {
  // 백그라운드에서 미리 로딩
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      fetchArtistsSimple().catch(error => {
        console.log('프리로딩 실패 (정상):', error);
      });
    }, 2000); // 2초 후 프리로딩
  }
}

// 이미지 프리로딩 함수
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

// 아티스트 이미지들 일괄 프리로딩
export async function preloadArtistImages(artists: Artist[]): Promise<void> {
  const imagePromises = artists
    .filter(artist => artist.profile_image)
    .map(artist => preloadImage(artist.profile_image!))
    .slice(0, 5); // 최대 5개까지만 프리로딩 (성능 최적화)

  try {
    await Promise.allSettled(imagePromises);
    console.log('아티스트 이미지 프리로딩 완료');
  } catch (error) {
    console.log('이미지 프리로딩 중 일부 실패 (정상):', error);
  }
}

// 네트워크 상태 확인 함수 개선
export function checkNetworkStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    // 브라우저 네트워크 상태 확인
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      resolve(navigator.onLine);
      return;
    }

    // 폴백: 간단한 fetch 테스트
    const testUrl = 'https://www.google.com/favicon.ico';
    const timeout = 3000; // 3초 타임아웃

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    fetch(testUrl, { 
      method: 'HEAD', 
      signal: controller.signal,
      cache: 'no-cache'
    })
      .then(() => {
        clearTimeout(timeoutId);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve(false);
      });
  });
}

// 개선된 에러 메시지 처리
export function getErrorMessage(error: any): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    const message = error.message;
    
    // 네트워크 관련 오류
    if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
      return '네트워크 연결을 확인해주세요.';
    }
    
    // 데이터베이스 관련 오류
    if (message.includes('JWT') || message.includes('auth')) {
      return '인증에 문제가 있습니다. 페이지를 새로고침해주세요.';
    }
    
    // Supabase 관련 오류
    if (message.includes('Supabase') || message.includes('database')) {
      return '데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    }
    
    // 타임아웃 오류
    if (message.includes('timeout') || message.includes('abort')) {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
    
    return message;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}

// 캐시 상태 모니터링
export function monitorCacheHealth() {
  const status = getArtistCacheStatus();
  console.log('캐시 상태 모니터링:', status);
  
  // 캐시가 만료되었으면 백그라운드에서 새로고침
  if (status.simple === 'expired') {
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

// 아티스트 데이터 관리를 위한 커스텀 훅
export function useArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [networkStatus, setNetworkStatus] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

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
        setRetryCount(0); // 성공 시 재시도 카운트 초기화
        setLoading(false);
        return;
      }
      
      // 최적화된 아티스트 데이터 조회
      const data = await fetchArtistsSimple();
      setArtists(data);
      setLastFetch(Date.now());
      setRetryCount(0); // 성공 시 재시도 카운트 초기화
      
    } catch (error) {
      console.error('아티스트 로딩 실패:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setArtists([]);
      
      // 재시도 로직
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        console.log(`재시도 ${retryCount + 1}/${maxRetries}`);
        
        // 지수 백오프로 재시도
        setTimeout(() => {
          loadArtists(forceRefresh);
        }, Math.pow(2, retryCount) * 1000);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount, maxRetries]);

  const refreshArtists = useCallback(() => {
    setRetryCount(0); // 수동 새로고침 시 재시도 카운트 초기화
    return loadArtists(true);
  }, [loadArtists]);

  // 컴포넌트 마운트 시 자동으로 아티스트 데이터 로드
  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  // 네트워크 상태 모니터링
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
      // 온라인 상태가 되면 자동으로 다시 로드
      if (error && error.includes('네트워크')) {
        loadArtists();
      }
    };
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, loadArtists]);

  return {
    artists,
    loading,
    error,
    lastFetch,
    networkStatus,
    retryCount,
    loadArtists,
    refreshArtists
  };
} 