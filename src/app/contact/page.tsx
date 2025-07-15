'use client';
import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import Header from '../../components/Header';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Artist {
  id: string;
  name_ko: string;
  name_en?: string;
}

const scriptURL = "https://script.google.com/macros/s/AKfycbzzR_Ps6QjFqwXzFUOTLcUMtcwSXffVfLZNzha4f6S1RM1-7GTRYMZlAtcanoHOLRv5RA/exec";

export default function ContactPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [form, setForm] = useState({
    artist_name: "",
    artist_selection: "select", // "select" or "custom"
    category: "",
    schedule_type: "specific", // "specific" or "approximate"
    start_date: "",
    end_date: "",
    place: "",
    manager_name: "",
    phone: "",
    email: "",
    budget: "",
    currency: "원",
    budget_undecided: false,
    message: ""
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 아티스트 목록 가져오기
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name_ko, name_en")
        .order("name_ko", { ascending: true });
      
      if (data) {
        setArtists(data);
      }
    };

    fetchArtists();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("전송 중...");
    
    // 아티스트 이름 결정
    let finalArtistName = form.artist_name;
    if (form.artist_selection === "select" && form.artist_name) {
      if (form.artist_name === "custom_recommendation") {
        finalArtistName = "미정(전문 에이전트에게 추천받기)";
      } else {
        const selectedArtist = artists.find(a => a.id === form.artist_name);
        finalArtistName = selectedArtist ? selectedArtist.name_ko : form.artist_name;
      }
    }
    
    // 메시지의 줄 바꿈을 HTML br 태그로 변환
    const formattedMessage = form.message.replace(/\n/g, '<br>');
    
    const sendData = {
      artist_name: finalArtistName,
      category: form.category,
      schedule_type: form.schedule_type,
      start_date: form.start_date,
      end_date: form.end_date,
      place: form.place,
      manager_name: form.manager_name,
      phone: form.phone,
      email: form.email,
      budget: form.budget_undecided ? "" : form.budget,
      currency: form.currency,
      message: formattedMessage
    };
    
    const params = new URLSearchParams(Object.fromEntries(Object.entries(sendData).map(([k, v]) => [k, String(v)]))).toString();
    
    try {
      const res = await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });
      const data = await res.json();
      if (data.result === "success") {
        setStatus("문의가 성공적으로 접수되었습니다!");
        setForm({
          artist_name: "",
          artist_selection: "select",
          category: "",
          schedule_type: "specific",
          start_date: "",
          end_date: "",
          place: "",
          manager_name: "",
          phone: "",
          email: "",
          budget: "",
          currency: "원",
          budget_undecided: false,
          message: ""
        });
      } else {
        setStatus("전송 실패: 다시 시도해 주세요.");
      }
    } catch (err) {
      setStatus("전송 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="연락처" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-wide mb-4 text-gray-800">
            연락처
          </h1>
          <p className="text-gray-600 text-lg">
            GRIGOENT와 함께하실 아티스트를 기다리고 있습니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 왼쪽 - 연락처 정보 */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold tracking-wide mb-6 text-gray-800">
              연락처 정보
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Phone size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">전화번호</p>
                  <p className="text-gray-800 text-lg font-medium">
                    +82) 02-6229-9229
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">이메일</p>
                  <p className="text-gray-800 text-lg font-medium">
                    contact@grigoent.co.kr
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <MapPin size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">주소</p>
                  <p className="text-gray-800 text-lg font-medium leading-relaxed">
                    서울특별시 마포구 성지3길 55, 3층
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">업무시간</p>
                  <p className="text-gray-800 text-lg font-medium">
                    평일 09:00 - 18:00
                  </p>
                </div>
              </div>
            </div>

            {/* 회사 정보 */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">회사 정보</h3>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-3 text-gray-800">GRIGOENT</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  엔터테인먼트 아티스트 매니지먼트 전문 회사로, 
                  다양한 분야의 아티스트들과 함께 성장하고 있습니다.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• 아티스트 매니지먼트</p>
                  <p>• 이벤트 기획 및 프로모션</p>
                  <p>• 브랜드 파트너십</p>
                  <p>• 미디어 콘텐츠 제작</p>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 - 문의 폼 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold tracking-wide mb-6 text-gray-800">
              섭외 문의
            </h2>
            
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
              {/* 아티스트 선택 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">
                  섭외 아티스트*
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="artist_selection"
                      value="select"
                      checked={form.artist_selection === "select"}
                      onChange={handleChange}
                      className="text-gray-800"
                    />
                    <span className="text-sm text-gray-700">아티스트 목록에서 선택</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="artist_selection"
                      value="custom"
                      checked={form.artist_selection === "custom"}
                      onChange={handleChange}
                      className="text-gray-800"
                    />
                    <span className="text-sm text-gray-700">직접 입력</span>
                  </label>
                </div>
              </div>

              {/* 아티스트 이름 입력 */}
              {form.artist_selection === "select" ? (
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-base">
                    섭외 아티스트*
                  </label>
                  <select
                    name="artist_name"
                    value={form.artist_name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner focus:ring-2 focus:ring-gray-300 text-base"
                  >
                    <option value="">아티스트를 선택해주세요</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.name_ko} {artist.name_en && `(${artist.name_en})`}
                      </option>
                    ))}
                    <option value="custom_recommendation">미정(전문 에이전트에게 추천받기)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 text-base">
                    섭외 아티스트*
                  </label>
                  <input
                    type="text"
                    name="artist_name"
                    value={form.artist_name}
                    onChange={handleChange}
                    placeholder="아티스트명을 입력해주세요"
                    required
                    disabled={isSubmitting}
                    className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner focus:ring-2 focus:ring-gray-300 text-base"
                  />
                </div>
              )}

              {/* 섭외 구분 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">
                  섭외 구분*
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner focus:ring-2 focus:ring-gray-300 text-base"
                >
                  <option value="">섭외 구분을 선택해주세요</option>
                  <option value="안무제작 (앨범, 광고안무, 챌린지 등)">안무제작 (앨범, 광고안무, 챌린지 등)</option>
                  <option value="출연 (방송, 유튜브 등 웹콘텐츠)">출연 (방송, 유튜브 등 웹콘텐츠)</option>
                  <option value="공연 (행사, 축제 등 공연)">공연 (행사, 축제 등 공연)</option>
                  <option value="행사 (팝업행사 참석 등)">행사 (팝업행사 참석 등)</option>
                  <option value="광고 (TVC, 인스타, 유튜브 채널 SNS광고)">광고 (TVC, 인스타, 유튜브 채널 SNS광고)</option>
                  <option value="레슨 (팝업, 트레이닝, 워크샵 등)">레슨 (팝업, 트레이닝, 워크샵 등)</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 섭외 일정 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">
                  섭외 일정*
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, schedule_type: "specific" }))}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      form.schedule_type === "specific" 
                        ? "bg-gray-800 text-white" 
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    구체 일정
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, schedule_type: "approximate" }))}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      form.schedule_type === "approximate" 
                        ? "bg-gray-800 text-white" 
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    대략 일정
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="flex-1 border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base"
                    placeholder="시작일자"
                  />
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="flex-1 border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base"
                    placeholder="종료일자"
                  />
                </div>
              </div>

              {/* 행사/이벤트 장소 */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800 text-base">
                  행사/이벤트 장소*
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    name="place"
                    value={form.place}
                    onChange={handleChange}
                    placeholder="장소 입력"
                    disabled={isSubmitting}
                    className="flex-1 border border-gray-200 px-4 py-3 rounded-xl shadow-inner text-base bg-gray-50 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, place: "미정" }))}
                    className="px-3 py-2 rounded-xl text-sm font-semibold border bg-gray-100 text-gray-700 border-gray-300"
                  >
                    미정
                  </button>
                </div>
              </div>

              {/* 담당자 정보 */}
              <input
                type="text"
                name="manager_name"
                value={form.manager_name}
                onChange={handleChange}
                placeholder="섭외 담당자명*"
                required
                disabled={isSubmitting}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base"
              />

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="담당자 연락처 (전화번호)"
                disabled={isSubmitting}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base"
              />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="담당자 이메일"
                disabled={isSubmitting}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner text-base"
              />

              {/* 예산 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-semibold text-gray-800 text-base">
                    예산*
                  </label>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      name="budget"
                      value={form.budget}
                      onChange={handleChange}
                      placeholder="예산(숫자)"
                      disabled={form.budget_undecided || isSubmitting}
                      className="w-full border border-gray-200 px-4 py-3 pr-20 rounded-xl shadow-inner text-base bg-gray-50 text-gray-900"
                    />
                    <select
                      name="currency"
                      value={form.currency}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent px-2 py-1 rounded-xl shadow-inner text-base focus:outline-none bg-white text-gray-900"
                      style={{ minWidth: "56px" }}
                    >
                      <option value="원">원</option>
                      <option value="달러">달러</option>
                      <option value="유로">유로</option>
                      <option value="엔화">엔화</option>
                      <option value="위안">위안</option>
                      <option value="THB">THB</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, budget_undecided: !prev.budget_undecided }))}
                    className="px-3 py-2 rounded-xl text-sm font-semibold border bg-gray-100 text-gray-700 border-gray-300"
                  >
                    미정
                  </button>
                </div>
              </div>

              {/* 문의사항 */}
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="문의사항*"
                required
                disabled={isSubmitting}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 shadow-inner min-h-[100px] text-base"
              />

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full text-lg font-bold text-center shadow-lg transition-all mt-2 flex items-center justify-center gap-2 bg-black text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>전송 중...</span>
                  </>
                ) : (
                  <span>문의 제출</span>
                )}
              </button>
            </form>

            {status && (
              <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
                status.includes("성공") 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : status.includes("실패") || status.includes("오류") 
                    ? "bg-red-100 text-red-800 border border-red-200" 
                    : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 