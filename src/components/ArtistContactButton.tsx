import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const RECRUIT_TYPES = [
  "방송출연", "공연", "행사", "광고", "레슨(팝업,워크샵,트레이닝)", "기타"
];
const CURRENCY_UNITS = ["원", "달러", "유로", "엔화", "위안", "THB", "기타"];

const ContactModal: React.FC<{
  open: boolean;
  onClose: () => void;
  artistName: string;
  artistList?: { id: string; name_ko: string }[];
}> = ({ open, onClose, artistName, artistList = [] }) => {
  const [selectedArtist, setSelectedArtist] = useState(artistName);
  const [recruitType, setRecruitType] = useState(RECRUIT_TYPES[0]);
  // 일정 관련
  const [scheduleType, setScheduleType] = useState<'detail' | 'rough'>('detail');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roughDate, setRoughDate] = useState("");
  // 장소
  const [place, setPlace] = useState("");
  const [placeUndecided, setPlaceUndecided] = useState(false);
  // 담당자
  const [manager, setManager] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // 예산
  const [budget, setBudget] = useState("");
  const [budgetUndecided, setBudgetUndecided] = useState(false);
  // 문의사항
  const [message, setMessage] = useState("");
  // 에러/성공
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currency, setCurrency] = useState(CURRENCY_UNITS[0]);

  useEffect(() => {
    setSelectedArtist(artistName);
  }, [artistName, open]);

  if (!open) return null;
  if (typeof window === "undefined" || !document.body) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 필수 검증: 아티스트, 구분, 일정, 장소, 담당자명, 연락처/이메일, 예산, 문의사항
    if (!selectedArtist || !recruitType || (!scheduleType && !roughDate) || (!place && !placeUndecided) || !manager || (!phone && !email) || (!budget && !budgetUndecided) || !message) {
      setError("필수 항목을 모두 입력해 주세요. (연락처 또는 이메일 중 하나는 필수)");
      return;
    }
    setError("");
    const payload = {
      artist: selectedArtist,
      recruitType,
      schedule: scheduleType === 'detail' ? { startDate, endDate } : { roughDate },
      place: placeUndecided ? '미정' : place,
      manager,
      phone,
      email,
      budget: budgetUndecided ? '미정' : budget, // 콤마 없는 원본 숫자
      currency,
      message,
    };
    setSuccess(true);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] z-[999]" onClick={onClose} />
      <div className={`fixed right-0 top-0 h-screen min-h-screen w-full sm:w-[400px] z-[1000] transition-transform duration-300 bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl flex flex-col items-center justify-center overflow-y-auto min-w-[320px] max-h-full rounded-none sm:rounded-l-3xl ${open ? 'translate-x-0' : 'translate-x-full'}`} style={{ boxShadow: "0 16px 64px 0 rgba(31, 38, 135, 0.37)", background: "rgba(255,255,255,0.85)" }}>
        <button className="absolute top-6 right-6 text-gray-700 hover:text-black text-3xl font-bold bg-white/80 rounded-full w-12 h-12 flex items-center justify-center shadow" onClick={onClose} aria-label="닫기" style={{backdropFilter: "blur(8px)"}}>×</button>
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900 drop-shadow">섭외 문의</h2>
        {success ? (
          <div className="text-green-700 text-center font-semibold py-16 text-xl">문의가 정상적으로 접수되었습니다!</div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 mx-auto px-4">
            {/* 1. 섭외 아티스트 */}
            <div>
              <label className="block font-semibold mb-2 text-gray-800 text-lg">섭외 아티스트*</label>
              {artistList && artistList.length > 0 ? (
                <select value={selectedArtist} onChange={e => setSelectedArtist(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner focus:ring-2 focus:ring-pink-400 text-lg">
                  {artistList.map(a => <option key={a.id} value={a.name_ko}>{a.name_ko}</option>)}
                </select>
              ) : (
                <input type="text" value={selectedArtist} onChange={e => setSelectedArtist(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner text-lg" />
              )}
            </div>
            {/* 2. 섭외 구분 */}
            <div>
              <label className="block font-semibold mb-2 text-gray-800 text-lg">섭외 구분*</label>
              <select value={recruitType} onChange={e => setRecruitType(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner focus:ring-2 focus:ring-pink-400 text-lg">
                {RECRUIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* 3. 섭외 일정 */}
            <div>
              <label className="block font-semibold mb-2 text-gray-800 text-lg">섭외 일정*</label>
              <div className="flex gap-2 mb-2">
                <button type="button" className={`px-3 py-1 rounded-full text-sm font-semibold ${scheduleType === 'detail' ? 'bg-pink-500 text-white' : 'bg-white/70 text-gray-700'}`} onClick={() => setScheduleType('detail')}>구체 일정</button>
                <button type="button" className={`px-3 py-1 rounded-full text-sm font-semibold ${scheduleType === 'rough' ? 'bg-pink-500 text-white' : 'bg-white/70 text-gray-700'}`} onClick={() => setScheduleType('rough')}>대략 일정</button>
              </div>
              {scheduleType === 'detail' ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-gray-700 mb-1 ml-1">시작일정</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner text-lg" placeholder="시작일자" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-gray-700 mb-1 ml-1">종료일정</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner text-lg" placeholder="종료일자" />
                  </div>
                </div>
              ) : (
                <input type="text" value={roughDate} onChange={e => setRoughDate(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner text-lg" placeholder="대략 일정(예: 7월 중순, 8월 말 등)" />
              )}
            </div>
            {/* 4. 행사/이벤트 장소 */}
            <div>
              <label className="block font-semibold mb-2 text-gray-800 text-lg">행사/이벤트 장소*</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={placeUndecided ? '' : place}
                  onChange={e => { setPlace(e.target.value); setPlaceUndecided(false); }}
                  className={`flex-1 border-none px-5 py-4 rounded-2xl shadow-inner text-lg ${placeUndecided ? 'bg-gray-200/70 text-gray-500' : 'bg-white/90 text-gray-900'}`}
                  placeholder={placeUndecided ? '미정' : '장소 입력'}
                  disabled={placeUndecided}
                />
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border ${placeUndecided ? 'bg-pink-500 text-white border-pink-500' : 'bg-white/70 text-gray-700 border-gray-300'}`}
                  onClick={() => { setPlaceUndecided(!placeUndecided); if (!placeUndecided) setPlace(''); }}
                >미정</button>
              </div>
            </div>
            {/* 5. 섭외 담당자명 */}
            <input type="text" placeholder="섭외 담당자명*" value={manager} onChange={e => setManager(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner text-lg" required />
            {/* 6. 담당자 연락처 */}
            <input type="text" placeholder="담당자 연락처 (전화번호)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner text-lg" />
            {/* 7. 담당자 이메일 */}
            <input type="email" placeholder="담당자 이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner text-lg" />
            {/* 8. 예산 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-semibold text-gray-800 text-lg">예산*</label>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budgetUndecided ? '' : (budget ? Number(budget).toLocaleString() : '')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setBudget(raw);
                      setBudgetUndecided(false);
                    }}
                    className={`w-full border-none px-5 py-4 pr-20 rounded-2xl shadow-inner text-lg ${budgetUndecided ? 'bg-gray-200/70 text-gray-500' : 'bg-white/90 text-gray-900'}`}
                    placeholder={budgetUndecided ? '미정' : '예산(숫자)'}
                    disabled={budgetUndecided}
                  />
                  <select
                    value={currency}
                    onChange={e => { setCurrency(e.target.value); setBudgetUndecided(false); }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent px-2 py-1 rounded-xl shadow-inner text-base focus:outline-none ${budgetUndecided ? 'bg-gray-200/70 text-gray-500' : 'bg-white/80 text-gray-900'}`}
                    disabled={budgetUndecided}
                    style={{ minWidth: 56 }}
                  >
                    {CURRENCY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border ${budgetUndecided ? 'bg-pink-500 text-white border-pink-500' : 'bg-white/70 text-gray-700 border-gray-300'}`}
                  onClick={() => { setBudgetUndecided(!budgetUndecided); if (!budgetUndecided) setBudget(''); }}
                >미정</button>
              </div>
            </div>
            {/* 9. 문의사항 */}
            <textarea placeholder="문의사항*" value={message} onChange={e => setMessage(e.target.value)} className="w-full border-none px-5 py-4 rounded-2xl bg-white/90 text-gray-900 shadow-inner min-h-[100px] text-lg" required />
            {error && <div className="text-red-500 text-base text-center font-semibold drop-shadow">{error}</div>}
            <button type="submit" className="w-full py-4 rounded-full bg-white text-gray-900 text-xl font-bold text-center shadow-lg hover:scale-105 transition-transform mt-2 border border-gray-300">문의 제출</button>
          </form>
        )}
      </div>
    </>,
    document.body
  );
};

const ArtistContactButton: React.FC<{ artistName: string; artistList?: { id: string; name_ko: string }[] }> = ({ artistName, artistList }) => {
  const [open, setOpen] = useState(false);
  return (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4">
      <button
        onClick={() => setOpen(true)}
      className="block w-full py-3 rounded-full bg-white text-gray-900 text-lg font-bold text-center shadow-lg hover:scale-105 transition-transform border border-gray-300"
    >
      섭외 문의하기
      </button>
      <ContactModal open={open} onClose={() => setOpen(false)} artistName={artistName} artistList={artistList} />
  </div>
);
};

export default ArtistContactButton; 