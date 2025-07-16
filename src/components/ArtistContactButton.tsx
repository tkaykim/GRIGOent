import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../utils/useTranslation";

const RECRUIT_TYPES_KO = [
  "안무제작 (앨범, 광고안무, 챌린지 등)",
  "출연 (방송, 유튜브 등 웹콘텐츠)",
  "공연 (행사, 축제 등 공연)",
  "행사 (팝업행사 참석 등)",
  "광고 (TVC, 인스타, 유튜브 채널 SNS광고)",
  "레슨 (팝업, 트레이닝, 워크샵 등)",
  "기타"
];

const RECRUIT_TYPES_EN = [
  "Choreography (Album, Ad choreography, Challenge, etc.)",
  "Appearance (Broadcast, YouTube, Web content, etc.)",
  "Performance (Events, Festivals, etc.)",
  "Event (Pop-up event participation, etc.)",
  "Advertisement (TVC, Instagram, YouTube channel SNS ads)",
  "Lesson (Pop-up, Training, Workshop, etc.)",
  "Other"
];

const CURRENCY_UNITS_KO = ["원", "달러", "유로", "엔화", "위안", "THB", "기타"];
const CURRENCY_UNITS_EN = ["KRW", "USD", "EUR", "JPY", "CNY", "THB", "Other"];

const ContactModal: React.FC<{
  open: boolean;
  onClose: () => void;
  artistName: string;
  artistList?: { id: string; name_ko: string; name_en?: string }[];
}> = ({ open, onClose, artistName, artistList = [] }) => {
  const { t, lang, setLang } = useTranslation();
  const [selectedArtist, setSelectedArtist] = useState(artistName);
  const [recruitType, setRecruitType] = useState(RECRUIT_TYPES_KO[0]);
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
  const [currency, setCurrency] = useState(CURRENCY_UNITS_KO[0]);
  // 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 언어에 따른 recruit types 설정
  const currentRecruitTypes = lang === 'ko' ? RECRUIT_TYPES_KO : RECRUIT_TYPES_EN;
  // 언어에 따른 화폐단위 설정
  const currentCurrencyUnits = lang === 'ko' ? CURRENCY_UNITS_KO : CURRENCY_UNITS_EN;

  // 언어에 따른 아티스트 이름 가져오기
  const getArtistNameByLang = (artist: { name_ko: string; name_en?: string }) => {
    if (lang === 'en' && artist.name_en) {
      return artist.name_en;
    }
    return artist.name_ko;
  };

  // 현재 선택된 아티스트의 이름을 언어에 맞게 가져오기
  const getCurrentArtistName = () => {
    if (artistList.length > 0) {
      const currentArtist = artistList.find(a => 
        a.name_ko === selectedArtist || a.name_en === selectedArtist
      );
      if (currentArtist) {
        return getArtistNameByLang(currentArtist);
      }
    }
    return selectedArtist;
  };

  useEffect(() => {
    setSelectedArtist(artistName);
  }, [artistName, open]);

  // 언어 변경 시 recruit type과 아티스트 이름 업데이트
  useEffect(() => {
    const currentIndex = currentRecruitTypes.findIndex(type => 
      type.includes(recruitType.split(' ')[0]) || 
      recruitType.includes(type.split(' ')[0])
    );
    if (currentIndex !== -1) {
      setRecruitType(currentRecruitTypes[currentIndex]);
    }

    // 아티스트 이름도 언어에 맞게 업데이트
    if (artistList.length > 0) {
      const currentArtist = artistList.find(a => 
        a.name_ko === selectedArtist || a.name_en === selectedArtist
      );
      if (currentArtist) {
        setSelectedArtist(getArtistNameByLang(currentArtist));
      }
    }

    // 화폐단위도 언어에 맞게 업데이트
    const currencyIndex = currentCurrencyUnits.findIndex(unit => 
      unit === currency || 
      (lang === 'ko' && unit === '원' && currency === 'KRW') ||
      (lang === 'en' && unit === 'KRW' && currency === '원')
    );
    if (currencyIndex !== -1) {
      setCurrency(currentCurrencyUnits[currencyIndex]);
    }
  }, [lang]);

  // 폼 초기화 함수
  const resetForm = () => {
    setSelectedArtist(artistName);
    setRecruitType(currentRecruitTypes[0]);
    setScheduleType('detail');
    setStartDate("");
    setEndDate("");
    setRoughDate("");
    setPlace("");
    setPlaceUndecided(false);
    setManager("");
    setPhone("");
    setEmail("");
    setBudget("");
    setBudgetUndecided(false);
    setMessage("");
    setError("");
    setSuccess(false);
    setCurrency(currentCurrencyUnits[0]);
    setIsSubmitting(false);
  };

  // 모달이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  if (!open) return null;
  if (typeof window === "undefined" || !document.body) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 필수 검증: 아티스트, 구분, 일정, 장소, 담당자명, 연락처/이메일, 예산, 문의사항
    if (!selectedArtist || !recruitType || (!scheduleType && !roughDate) || (!place && !placeUndecided) || !manager || (!phone && !email) || (!budget && !budgetUndecided) || !message) {
      setError(t("contact_required_fields"));
      return;
    }
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    
    // 메시지의 줄 바꿈을 HTML br 태그로 변환
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    // 스프레드시트 및 Apps Script와 맞는 파라미터로 구성
    const payload = {
      artist: selectedArtist,
      recruitType,
      schedule: scheduleType === 'detail'
        ? `${startDate} ~ ${endDate}`
        : roughDate,
      place: placeUndecided ? '미정' : place,
      manager,
      phone,
      email,
      budget: budgetUndecided ? '' : budget,
      currency,
      budgetUndecided: budgetUndecided ? 'true' : '',
      message: formattedMessage,
    };
    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbwX_avPCecL3f8gsp2cn24-OQGlbUgwwrNWsXYor8SlqZxZu23iAOd7NW7jCV2ICFo/exec", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload).toString(),
      });
      const data = await res.json();
      if (data.result === "success") {
        setSuccess(true);
        // 성공 후 3초 뒤 모달 닫기
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(t("contact_submit_failed"));
      }
    } catch (err) {
      setError(t("contact_network_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <>
      {/* 흐림효과 없는 반투명 검정 배경 */}
      <div className="fixed inset-0 bg-black/40 z-[999]" onClick={onClose} />
      {/* 우측 슬라이드 인 모달 */}
      <div className={`fixed right-0 top-0 h-screen min-h-screen w-full sm:w-[400px] z-[1000] transition-transform duration-300 bg-white rounded-none sm:rounded-l-3xl shadow-2xl border-l border-gray-100 flex flex-col items-center justify-start overflow-y-auto min-w-[320px] max-h-full ${open ? 'translate-x-0' : 'translate-x-full'}`}> 
        {/* 상단 닫기 버튼 */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2 bg-white border-b border-gray-100 w-full">
          <h2 className="text-2xl font-extrabold text-gray-900">{t("contact_title")}</h2>
          <div className="flex items-center gap-2">
            {/* 언어 변환 버튼 */}
            <button 
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="px-3 py-1 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {lang === 'ko' ? 'EN' : '한'}
            </button>
            <button className="text-gray-400 hover:text-black text-3xl font-bold bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-none" onClick={onClose} aria-label="닫기">×</button>
          </div>
        </div>
        <div className="p-8 pt-4 overflow-y-auto w-full max-h-[80vh] flex-1">
          {success ? (
            <div className="text-green-700 text-center font-semibold py-16 text-xl">{t("contact_success")}</div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 mx-auto">
              {/* 1. 섭외 아티스트 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">{t("contact_artist")}*</label>
                {artistList && artistList.length > 0 ? (
                  <select value={getCurrentArtistName()} onChange={e => setSelectedArtist(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner focus:ring-2 focus:ring-gray-300 text-base" disabled={isSubmitting}>
                    {artistList.map(a => (
                      <option key={a.id} value={getArtistNameByLang(a)}>
                        {getArtistNameByLang(a)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={selectedArtist} onChange={e => setSelectedArtist(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base" disabled={isSubmitting} />
                )}
              </div>
              {/* 2. 섭외 구분 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">{t("contact_type")}*</label>
                <select value={recruitType} onChange={e => setRecruitType(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner focus:ring-2 focus:ring-gray-300 text-base" disabled={isSubmitting}>
                  {currentRecruitTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* 3. 섭외 일정 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">{t("contact_schedule")}*</label>
                <div className="flex gap-2 mb-2">
                  <button type="button" className={`px-3 py-1 rounded-full text-sm font-semibold ${scheduleType === 'detail' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setScheduleType('detail')} disabled={isSubmitting}>{t("contact_detail_schedule")}</button>
                  <button type="button" className={`px-3 py-1 rounded-full text-sm font-semibold ${scheduleType === 'rough' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setScheduleType('rough')} disabled={isSubmitting}>{t("contact_rough_schedule")}</button>
                </div>
                {scheduleType === 'detail' ? (
                  <div className="flex gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base" placeholder={t("date_start")} disabled={isSubmitting} />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base" placeholder={t("date_end")} disabled={isSubmitting} />
                  </div>
                ) : (
                  <input type="text" value={roughDate} onChange={e => setRoughDate(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base" placeholder={t("contact_schedule_example")} disabled={isSubmitting} />
                )}
              </div>
              {/* 4. 행사/이벤트 장소 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">{t("contact_place")}*</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={placeUndecided ? '' : place}
                    onChange={e => { setPlace(e.target.value); setPlaceUndecided(false); }}
                    className={`flex-1 border border-gray-200 px-4 py-3 rounded-xl shadow-inner text-base ${placeUndecided ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-900'}`}
                    placeholder={placeUndecided ? t("contact_place_undecided") : t("contact_place_input")}
                    disabled={placeUndecided || isSubmitting}
                  />
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border ${placeUndecided ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    onClick={() => { setPlaceUndecided(!placeUndecided); if (!placeUndecided) setPlace(''); }}
                    disabled={isSubmitting}
                  >{t("contact_undecided")}</button>
                </div>
              </div>
              {/* 5. 섭외 담당자명 */}
              <input type="text" placeholder={t("contact_manager_placeholder")} value={manager} onChange={e => setManager(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base" required disabled={isSubmitting} />
              {/* 6. 담당자 연락처 */}
              <input type="text" placeholder={t("contact_phone_placeholder")} value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base" disabled={isSubmitting} />
              {/* 7. 담당자 이메일 */}
              <input type="email" placeholder={t("contact_email_placeholder")} value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base" disabled={isSubmitting} />
              {/* 8. 예산 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-semibold text-gray-800 text-base">{t("contact_budget")}*</label>
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
                      className={`w-full border border-gray-200 px-4 py-3 pr-20 rounded-xl shadow-inner text-base ${budgetUndecided ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-900'}`}
                      placeholder={budgetUndecided ? t("contact_budget_undecided") : t("contact_budget_input")}
                      disabled={budgetUndecided || isSubmitting}
                    />
                    <select
                      value={currency}
                      onChange={e => { setCurrency(e.target.value); setBudgetUndecided(false); }}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent px-2 py-1 rounded-xl shadow-inner text-base focus:outline-none ${budgetUndecided ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
                      disabled={budgetUndecided || isSubmitting}
                      style={{ minWidth: 56 }}
                    >
                      {currentCurrencyUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border ${budgetUndecided ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    onClick={() => { setBudgetUndecided(!budgetUndecided); if (!budgetUndecided) setBudget(''); }}
                    disabled={isSubmitting}
                  >{t("contact_undecided")}</button>
                </div>
              </div>
              {/* 9. 문의사항 */}
              <textarea placeholder={t("contact_message_placeholder")} value={message} onChange={e => setMessage(e.target.value)} className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner min-h-[100px] text-base" required disabled={isSubmitting} />
              {error && <div className="text-red-500 text-base text-center font-semibold drop-shadow">{error}</div>}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3 rounded-full text-lg font-bold text-center shadow-lg transition-all mt-2 flex items-center justify-center gap-2 ${
                  isSubmitting 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-black text-white hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("contact_submitting")}
                  </>
                ) : (
                  t("contact_submit")
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

const ArtistContactButton: React.FC<{ artistName: string; artistList?: { id: string; name_ko: string; name_en?: string }[] }> = ({ artistName, artistList }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative px-8 py-4 rounded-full bg-white text-gray-900 text-base font-bold text-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 whitespace-nowrap overflow-hidden group"
      >
        {/* 움직이는 라이트 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
        
        <span className="relative flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          CONTACT
        </span>
      </button>
      <ContactModal open={open} onClose={() => setOpen(false)} artistName={artistName} artistList={artistList} />
    </>
  );
};

export default ArtistContactButton; 