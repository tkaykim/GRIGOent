-- 아티스트 조회 성능 최적화 SQL
-- 하드 새로고침 시 아티스트 리스트 로딩 속도 개선

-- ============================================
-- 1. 기존 인덱스 확인 및 최적화
-- ============================================

-- artists 테이블 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_artists_artist_type_created_at 
ON public.artists(artist_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artists_user_id_active 
ON public.artists(user_id) 
WHERE user_id IS NOT NULL;

-- users 테이블 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_users_role_active 
ON public.users(role, is_active) 
WHERE role IN ('choreographer', 'partner_choreographer');

CREATE INDEX IF NOT EXISTS idx_users_slug_active 
ON public.users(slug, is_active) 
WHERE slug IS NOT NULL;

-- artists_careers 테이블 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_artists_careers_artist_id_created 
ON public.artists_careers(artist_id, created_at DESC);

-- ============================================
-- 2. 복합 인덱스 추가 (JOIN 성능 향상)
-- ============================================

-- artists와 users 테이블 JOIN 최적화
CREATE INDEX IF NOT EXISTS idx_artists_user_id_type_created 
ON public.artists(user_id, artist_type, created_at DESC) 
WHERE user_id IS NOT NULL;

-- ============================================
-- 3. 통계 정보 업데이트
-- ============================================

-- 테이블 통계 정보 업데이트 (쿼리 플래너 최적화)
ANALYZE public.artists;
ANALYZE public.users;
ANALYZE public.artists_careers;

-- ============================================
-- 4. 성능 모니터링 뷰 생성
-- ============================================

-- 아티스트 조회 성능 모니터링 뷰
CREATE OR REPLACE VIEW public.artist_performance_stats AS
SELECT 
    'artists' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN artist_type IN ('choreographer', 'partner_choreographer') THEN 1 END) as active_artists,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked_users,
    MAX(created_at) as latest_record
FROM public.artists
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN role IN ('choreographer', 'partner_choreographer') AND is_active = true THEN 1 END) as active_artists,
    COUNT(CASE WHEN slug IS NOT NULL THEN 1 END) as slug_users,
    MAX(created_at) as latest_record
FROM public.users;

-- ============================================
-- 5. 캐시 테이블 생성 (선택적)
-- ============================================

-- 아티스트 목록 캐시 테이블 (선택적 사용)
CREATE TABLE IF NOT EXISTS public.artist_cache (
    id SERIAL PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    cache_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 캐시 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_artist_cache_key_expires 
ON public.artist_cache(cache_key, expires_at);

-- 캐시 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.artist_cache 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 성능 최적화 확인 쿼리
-- ============================================

-- 인덱스 사용 현황 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename IN ('artists', 'users', 'artists_careers')
ORDER BY idx_scan DESC;

-- 테이블 크기 및 통계 확인
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('artists', 'users', 'artists_careers')
AND attname IN ('artist_type', 'user_id', 'role', 'is_active', 'created_at')
ORDER BY tablename, attname;

-- ============================================
-- 7. 실행 계획 최적화 힌트
-- ============================================

-- 아티스트 조회 최적화된 쿼리 예시
/*
-- 최적화된 아티스트 조회 쿼리 (애플리케이션에서 사용)
SELECT 
    a.id,
    a.name_ko,
    a.name_en,
    a.profile_image,
    a.artist_type,
    a.user_id,
    u.slug,
    u.is_active
FROM public.artists a
INNER JOIN public.users u ON a.user_id = u.id
WHERE a.artist_type IN ('choreographer', 'partner_choreographer')
  AND u.is_active = true
ORDER BY a.created_at DESC
LIMIT 20;
*/

-- ============================================
-- 8. 모니터링 및 알림 설정 (선택적)
-- ============================================

-- 느린 쿼리 모니터링 함수
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS void AS $$
BEGIN
    -- 느린 쿼리 로깅 로직 (필요시 구현)
    NULL;
END;
$$ LANGUAGE plpgsql;

-- 성능 메트릭 수집 함수
CREATE OR REPLACE FUNCTION collect_performance_metrics()
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    collected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'artist_query_count'::TEXT,
        COUNT(*)::NUMERIC,
        NOW()
    FROM pg_stat_activity 
    WHERE query LIKE '%artists%'
    AND state = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. 실행 결과 확인
-- ============================================

-- 최적화 결과 확인
SELECT '인덱스 최적화 완료' as status, NOW() as completed_at;

-- 성능 통계 확인
SELECT * FROM public.artist_performance_stats; 