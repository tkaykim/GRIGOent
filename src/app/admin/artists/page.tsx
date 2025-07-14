"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { ArtistCareer } from "../../../components/ArtistProfile";
import Header from "../../../components/Header";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CAREER_TYPES = [
  { value: "choreo", label: "안무제작" },
  { value: "broadcast", label: "방송출연" },
  { value: "event", label: "행사출연" },
  { value: "ad", label: "광고출연" },
  { value: "dancer", label: "댄서참여" },
  { value: "workshop", label: "워크샵" },
];

export default function AdminArtistRegisterPage() {
  // 등록 폼 상태
  const [nameKo, setNameKo] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [bio, setBio] = useState("");
  const [youtubeLinks, setYoutubeLinks] = useState("");
  const [careers, setCareers] = useState<Omit<ArtistCareer, 'id'>[]>([
    { type: "choreo", title: "", detail: "", country: "", video_url: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [bulkCareersText, setBulkCareersText] = useState("");
  const [bulkCareers, setBulkCareers] = useState<Omit<ArtistCareer, 'id'>[]>([]);

  // 아티스트 목록 상태
  const [artists, setArtists] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [editCareers, setEditCareers] = useState<any[]>([]);

  // 모달 상태 추가
  const [careerModal, setCareerModal] = useState<{type: string, careers: unknown[]} | null>(null);
  // 영상 상세 모달 상태 추가
  const [selectedCareer, setSelectedCareer] = useState<any | null>(null);

  // 아티스트 목록 불러오기 (artists_careers 포함)
  const fetchArtists = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("artists")
      .select("*, artists_careers(*)")
      .order("created_at", { ascending: false });
    if (!error) setArtists(data || []);
    setFetching(false);
  };
  useEffect(() => { fetchArtists(); }, []);

  // 경력 추가/삭제
  const addCareer = () => setCareers([...careers, { type: "choreo", title: "", detail: "", country: "", video_url: "" }]);
  const removeCareer = (idx: number) => setCareers(careers.filter((_, i) => i !== idx));
  const updateCareer = (idx: number, field: string, value: string) => {
    setCareers(careers.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  // 대량 입력 파싱
  const parseBulkCareers = (text: string): Omit<ArtistCareer, 'id'>[] => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    return lines.map(line => {
      // 쉼표 또는 탭으로 구분
      const [type, title, detail, country, video_url] = line.split(/,|\t/).map(s => s.trim());
      return { type: type || "choreo", title: title || "", detail: detail || "", country: country || "", video_url: video_url || "" };
    });
  };

  // 대량 입력 textarea 변경 시 파싱
  const handleBulkCareersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBulkCareersText(e.target.value);
    setBulkCareers(parseBulkCareers(e.target.value));
  };

  // 등록 핸들러 수정: 대량입력 경력도 함께 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const links = youtubeLinks
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // 1. artists 테이블에 insert
    const { data: artistData, error: artistError } = await supabase.from("artists").insert([
      {
        name_ko: nameKo,
        name_en: nameEn || null,
        name_ja: nameJa || null,
        name_zh: nameZh || null,
        profile_image: profileImage,
        bio,
        youtube_links: links,
      },
    ]).select("id").single();
    if (artistError || !artistData) {
      setMessage(`등록 실패: ${artistError?.message}`);
      setLoading(false);
      return;
    }
    // 2. artists_careers 테이블에 insert (여러 개)
    const careersToInsert = [
      ...careers.filter(c => c.title.trim() !== ""),
      ...bulkCareers.filter(c => c.title.trim() !== "")
    ].map(c => ({ ...c, artist_id: artistData.id, country: c.type === "workshop" ? c.country : null, video_url: c.video_url || null }));
    if (careersToInsert.length > 0) {
      const { error: careerError } = await supabase.from("artists_careers").insert(careersToInsert);
      if (careerError) {
        setMessage(`경력 등록 실패: ${careerError.message}`);
        setLoading(false);
        return;
      }
    }
    setMessage("아티스트가 성공적으로 등록되었습니다.");
    setNameKo(""); setNameEn(""); setNameJa(""); setNameZh("");
    setProfileImage(""); setBio(""); setYoutubeLinks("");
    setCareers([{ type: "choreo", title: "", detail: "", country: "", video_url: "" }]);
    setBulkCareersText(""); setBulkCareers([]);
    fetchArtists();
    setLoading(false);
  };

  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("artists").delete().eq("id", id);
    if (error) {
      setMessage(`삭제 실패: ${error.message}`);
    } else {
      setMessage("삭제되었습니다.");
      fetchArtists();
    }
  };

  // 아티스트 수정 모드 진입 시 경력사항도 세팅
  const startEdit = (artist: any) => {
    setEditId(artist.id);
    setEditData({
      name_ko: artist.name_ko || "",
      name_en: artist.name_en || "",
      name_ja: artist.name_ja || "",
      name_zh: artist.name_zh || "",
      profile_image: artist.profile_image || "",
      bio: artist.bio || "",
      youtube_links: (artist.youtube_links || []).join("\n"),
    });
    setEditCareers(artist.artists_careers || []);
  };

  // 경력사항 개별 삭제
  const handleCareerDelete = async (careerId: string) => {
    if (!confirm("정말 이 경력을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("artists_careers").delete().eq("id", careerId);
    if (!error) {
      setEditCareers(editCareers.filter(c => c.id !== careerId));
      fetchArtists();
      setMessage("경력이 삭제되었습니다.");
    } else {
      setMessage(`경력 삭제 실패: ${error.message}`);
    }
  };

  // 수정 핸들러
  const handleEditSave = async (id: string) => {
    const links = (editData.youtube_links as string)
      .split(/[\n,]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    const { error } = await supabase.from("artists").update({
      name_ko: editData.name_ko,
      name_en: editData.name_en || null,
      name_ja: editData.name_ja || null,
      name_zh: editData.name_zh || null,
      profile_image: editData.profile_image,
      bio: editData.bio,
      youtube_links: links,
    }).eq("id", id);
    if (error) {
      setMessage(`수정 실패: ${error.message}`);
    } else {
      setMessage("수정되었습니다.");
      fetchArtists();
      cancelEdit();
    }
  };

  // 수정 취소
  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
    setEditCareers([]);
  };

  return (
    <>
      <Header title="아티스트 관리" />
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">아티스트 등록 (관리자)</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        {/* 기본 정보 입력 */}
        <div>
          <label className="block font-semibold mb-1">이름(한국어) *</label>
          <input type="text" value={nameKo} onChange={(e) => setNameKo(e.target.value)} required className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">이름(영어, 선택)</label>
          <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">이름(일본어, 선택)</label>
          <input type="text" value={nameJa} onChange={(e) => setNameJa(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">이름(중국어, 선택)</label>
          <input type="text" value={nameZh} onChange={(e) => setNameZh(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">프로필 이미지 URL</label>
          <input type="text" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-semibold mb-1">소개</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full border px-3 py-2 rounded min-h-[80px]" />
        </div>
        <div>
          <label className="block font-semibold mb-1">유튜브 링크 (여러 개 입력 시 줄바꿈 또는 콤마로 구분)</label>
          <textarea value={youtubeLinks} onChange={(e) => setYoutubeLinks(e.target.value)} className="w-full border px-3 py-2 rounded min-h-[60px]" />
        </div>
        {/* 경력사항 대량 입력 */}
        <div>
          <label className="block font-semibold mb-2">경력 대량 입력 (type, title, detail, country, video_url 순, 쉼표/탭 구분)</label>
          <textarea value={bulkCareersText} onChange={handleBulkCareersChange} className="w-full border px-3 py-2 rounded min-h-[80px]" placeholder="예: choreo,ITZY - WANNABE,전체제작,,https://youtu.be/xxx" />
          {bulkCareers.length > 0 && (
            <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
              <div className="font-bold mb-1">미리보기</div>
              <ul className="list-disc pl-5">
                {bulkCareers.map((c, i) => (
                  <li key={i}>{CAREER_TYPES.find(t => t.value === c.type)?.label || c.type} | {c.title} | {c.detail} | {c.country} | {c.video_url}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* 기존 경력 개별 입력 UI */}
        <div>
          <label className="block font-semibold mb-2">경력사항</label>
          {careers.map((career, idx) => (
            <div key={idx} className="flex flex-col gap-2 border p-3 mb-2 rounded bg-white/5">
              <div className="flex gap-2">
                <select value={(career as any).type} onChange={e => updateCareer(idx, "type", e.target.value)} className="border rounded px-2 py-1">
                  {CAREER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input type="text" value={(career as any).title} onChange={e => updateCareer(idx, "title", e.target.value)} placeholder="경력명/곡명/프로젝트명" className="border rounded px-2 py-1 flex-1" />
                <button type="button" onClick={() => removeCareer(idx)} className="text-red-500 font-bold px-2">삭제</button>
              </div>
              <input type="text" value={(career as any).detail} onChange={e => updateCareer(idx, "detail", e.target.value)} placeholder="상세설명(부분참여 등)" className="border rounded px-2 py-1" />
              {(career as any).type === "workshop" && (
                <input type="text" value={(career as any).country} onChange={e => updateCareer(idx, "country", e.target.value)} placeholder="국가명(워크샵만)" className="border rounded px-2 py-1" />
              )}
              <input type="text" value={(career as any).video_url} onChange={e => updateCareer(idx, "video_url", e.target.value)} placeholder="참고영상 링크(선택)" className="border rounded px-2 py-1" />
            </div>
          ))}
          <button type="button" onClick={addCareer} className="bg-gray-200 px-3 py-1 rounded font-bold mt-2">+ 경력 추가</button>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50">
          {loading ? "등록 중..." : "아티스트 등록"}
        </button>
      </form>
      {message && <div className="mb-6 text-center font-semibold">{message}</div>}
      <h2 className="text-xl font-bold mb-4">등록된 아티스트 목록</h2>
      {fetching ? (
        <div>불러오는 중...</div>
      ) : (
        <div className="space-y-4">
          {artists.length === 0 && <div>등록된 아티스트가 없습니다.</div>}
          {artists.map((artist: any) => (
            <div key={(artist as any).id} className="border rounded p-4 flex flex-col gap-2 bg-white/10">
              {editId === (artist as any).id ? (
                <>
                  <input type="text" value={(editData as any).name_ko} onChange={e => setEditData({ ...editData, name_ko: e.target.value })} className="border px-2 py-1 rounded mb-1" placeholder="이름(한국어)" />
                  <input type="text" value={(editData as any).name_en} onChange={e => setEditData({ ...editData, name_en: e.target.value })} className="border px-2 py-1 rounded mb-1" placeholder="이름(영어)" />
                  <input type="text" value={(editData as any).name_ja} onChange={e => setEditData({ ...editData, name_ja: e.target.value })} className="border px-2 py-1 rounded mb-1" placeholder="이름(일본어)" />
                  <input type="text" value={(editData as any).name_zh} onChange={e => setEditData({ ...editData, name_zh: e.target.value })} className="border px-2 py-1 rounded mb-1" placeholder="이름(중국어)" />
                  <input type="text" value={(editData as any).profile_image} onChange={e => setEditData({ ...editData, profile_image: e.target.value })} className="border px-2 py-1 rounded mb-1" placeholder="프로필 이미지" />
                  <textarea value={(editData as any).bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} className="border px-2 py-1 rounded mb-1 min-h-[40px]" placeholder="소개" />
                  <textarea value={(editData as any).youtube_links} onChange={e => setEditData({ ...editData, youtube_links: e.target.value })} className="border px-2 py-1 rounded mb-1 min-h-[30px]" placeholder="유튜브 링크" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleEditSave((artist as any).id)} className="bg-green-600 text-white px-3 py-1 rounded font-bold hover:bg-green-700">저장</button>
                    <button onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded font-bold hover:bg-gray-500">취소</button>
                  </div>
                  {/* 경력사항 리스트 및 삭제 */}
                  <div className="mt-2">
                    <div className="font-semibold mb-1">경력사항</div>
                    {(editCareers as any[]).length === 0 && <div className="text-sm text-gray-400">경력 없음</div>}
                    <ul className="list-disc pl-5">
                      {(editCareers as any[]).map((c: any) => (
                        <li key={c.id} className="flex items-center gap-2">
                          <span>{CAREER_TYPES.find(t => t.value === c.type)?.label || c.type} | {c.title} | {c.detail} | {c.country} | {c.video_url}</span>
                          <button type="button" onClick={() => handleCareerDelete(c.id)} className="text-red-500 text-xs font-bold ml-2">삭제</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {(artist as any).profile_image && <img src={(artist as any).profile_image} alt="프로필" className="w-12 h-12 rounded-full object-cover" />}
                    <div>
                      <div className="font-bold text-lg">{(artist as any).name_ko}</div>
                      <div className="text-sm text-gray-300">
                        {(artist as any).name_en && <span>EN: {(artist as any).name_en} </span>}
                        {(artist as any).name_ja && <span>JP: {(artist as any).name_ja} </span>}
                        {(artist as any).name_zh && <span>CN: {(artist as any).name_zh}</span>}
                      </div>
                      <div className="text-sm text-gray-300">{(artist as any).bio}</div>
                      {(artist as any).youtube_links && (artist as any).youtube_links.length > 0 && (
                        <div className="text-xs mt-1">유튜브: {(artist as any).youtube_links.join(", ")}</div>
                      )}
                    </div>
                  </div>
                  {/* 경력사항 리스트 */}
                  <div className="mt-2">
                    <div className="font-semibold mb-1">경력사항</div>
                    {(artist as any).artists_careers?.length === 0 && <div className="text-sm text-gray-400">경력 없음</div>}
                    {CAREER_TYPES.map(type => {
                      const careers = (artist as any).artists_careers?.filter((c: any) => c.type === type.value) || [];
                      if (careers.length === 0) return null;
                      const preview = careers.slice(0, 3);
                      return (
                        <div key={type.value} className="mb-4">
                          <div className="text-base font-bold text-pink-500 mb-2 flex items-center gap-2">
                            {type.label}
                            {careers.length > 3 && (
                              <button
                                className="text-xs text-blue-300 underline ml-2 hover:text-blue-400"
                                onClick={() => setCareerModal({ type: type.label, careers })}
                                type="button"
                              >
                                더보기 +{careers.length - 3}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {preview.map((c: any) => {
                              let ytThumb = null;
                              if (c.video_url && c.video_url.includes("youtube.com")) {
                                const match = c.video_url.match(/v=([\w-]+)/);
                                const vid = match ? match[1] : null;
                                if (vid) ytThumb = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                              } else if (c.video_url && c.video_url.includes("youtu.be")) {
                                const match = c.video_url.match(/youtu.be\/([\w-]+)/);
                                const vid = match ? match[1] : null;
                                if (vid) ytThumb = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                              }
                              return (
                                <div
                                  key={c.id}
                                  className="rounded-xl bg-white/10 p-3 flex gap-3 items-center shadow-sm cursor-pointer hover:bg-white/20 transition"
                                  onClick={() => setSelectedCareer(c)}
                                  tabIndex={0}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedCareer(c); }}
                                  role="button"
                                  aria-label="경력 상세 보기"
                                >
                                  {ytThumb ? (
                                    <img src={ytThumb} alt="영상 썸네일" className="w-20 h-14 rounded-lg object-cover border border-white/20" />
                                  ) : c.video_url ? (
                                    <span className="text-xs underline text-blue-300">영상보기</span>
                                  ) : null}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white truncate">{c.title}</div>
                                    {c.detail && <div className="text-xs text-gray-200 truncate">{c.detail}</div>}
                                    {c.country && <div className="text-xs text-gray-400">국가: {c.country}</div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {/* 모달 */}
                    {careerModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <div className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-2xl">
                          <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
                            onClick={() => setCareerModal(null)}
                            aria-label="닫기"
                          >
                            ×
                          </button>
                          <div className="text-lg font-bold text-pink-600 mb-4">{careerModal.type} 전체 경력 ({careerModal.careers.length}개)</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                            {careerModal.careers.map((c: any) => {
                              let ytThumb = null;
                              if (c.video_url && c.video_url.includes("youtube.com")) {
                                const match = c.video_url.match(/v=([\w-]+)/);
                                const vid = match ? match[1] : null;
                                if (vid) ytThumb = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                              } else if (c.video_url && c.video_url.includes("youtu.be")) {
                                const match = c.video_url.match(/youtu.be\/([\w-]+)/);
                                const vid = match ? match[1] : null;
                                if (vid) ytThumb = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                              }
                              return (
                                <div
                                  key={c.id}
                                  className="rounded-xl bg-gray-100 p-3 flex gap-3 items-center shadow-sm cursor-pointer hover:bg-gray-200 transition"
                                  onClick={() => setSelectedCareer(c)}
                                  tabIndex={0}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedCareer(c); }}
                                  role="button"
                                  aria-label="경력 상세 보기"
                                >
                                  {ytThumb ? (
                                    <img src={ytThumb} alt="영상 썸네일" className="w-20 h-14 rounded-lg object-cover border border-gray-300" />
                                  ) : c.video_url ? (
                                    <span className="text-xs underline text-blue-600">영상보기</span>
                                  ) : null}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{c.title}</div>
                                    {c.detail && <div className="text-xs text-gray-600 truncate">{c.detail}</div>}
                                    {c.country && <div className="text-xs text-gray-500">국가: {c.country}</div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => startEdit(artist)} className="bg-yellow-500 text-white px-3 py-1 rounded font-bold hover:bg-yellow-600">수정</button>
                    <button onClick={() => handleDelete((artist as any).id)} className="bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-700">삭제</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {/* 영상 상세 모달 */}
      {selectedCareer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl flex flex-col items-center">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
              onClick={() => setSelectedCareer(null)}
              aria-label="닫기"
            >
              ×
            </button>
            {/* 영상 플레이어 */}
            {(selectedCareer as any).video_url && ((selectedCareer as any).video_url.includes("youtube.com") || (selectedCareer as any).video_url.includes("youtu.be")) ? (
              <div className="w-full aspect-video mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${(() => {
                    if ((selectedCareer as any).video_url.includes("youtube.com")) {
                      const match = ((selectedCareer as any).video_url as string).match(/v=([\w-]+)/);
                      return match ? match[1] : "";
                    } else if ((selectedCareer as any).video_url.includes("youtu.be")) {
                      const match = ((selectedCareer as any).video_url as string).match(/youtu.be\/([\w-]+)/);
                      return match ? match[1] : "";
                    }
                    return "";
                  })()}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-56 rounded-lg border border-gray-300"
                />
              </div>
            ) : (selectedCareer as any).video_url ? (
              <div className="w-full mb-4">
                <a href={(selectedCareer as any).video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">외부 영상 보기</a>
              </div>
            ) : null}
            {/* 작품 설명 */}
            <div className="w-full text-center">
              <div className="text-lg font-bold text-gray-900 mb-1">{(selectedCareer as any).title}</div>
              {(selectedCareer as any).detail && <div className="text-base text-gray-700 mb-1">{(selectedCareer as any).detail}</div>}
              {(selectedCareer as any).country && <div className="text-sm text-gray-500 mb-1">국가: {(selectedCareer as any).country}</div>}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
} 