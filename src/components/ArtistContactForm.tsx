import React, { useState } from "react";

const scriptURL = "https://script.google.com/macros/s/AKfycbzzR_Ps6QjFqwXzFUOTLcUMtcwSXffVfLZNzha4f6S1RM1-7GTRYMZlAtcanoHOLRv5RA/exec";

export default function ArtistContactForm() {
  const [form, setForm] = useState({
    artist_name: "",
    manager_name: "",
    start_date: "",
    end_date: "",
    approximate_date: "",
    type: "",
    place: "",
    budget: "",
    currency: "",
    budget_undecided: false,
    email: "",
    phone: "",
    message: ""
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    
    // 메시지의 줄 바꿈을 HTML br 태그로 변환
    const formattedMessage = form.message.replace(/\n/g, '<br>');
    
    const sendData = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, String(v)]));
    if (sendData.budget_undecided === "true") sendData.budget = "";
    // 메시지를 포맷된 버전으로 교체
    sendData.message = formattedMessage;
    
    const params = new URLSearchParams(sendData).toString();
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
          manager_name: "",
          start_date: "",
          end_date: "",
          approximate_date: "",
          type: "",
          place: "",
          budget: "",
          currency: "",
          budget_undecided: false,
          email: "",
          phone: "",
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <input name="artist_name" value={form.artist_name} onChange={handleChange} placeholder="아티스트명" required disabled={isSubmitting} />
      <input name="manager_name" value={form.manager_name} onChange={handleChange} placeholder="담당자명" required disabled={isSubmitting} />
      <input name="start_date" value={form.start_date} onChange={handleChange} placeholder="시작일정 (YYYY-MM-DD)" disabled={isSubmitting} />
      <input name="end_date" value={form.end_date} onChange={handleChange} placeholder="종료일정 (YYYY-MM-DD)" disabled={isSubmitting} />
      <input name="approximate_date" value={form.approximate_date} onChange={handleChange} placeholder="대략 일정/미정 (예: 6월 중순, 미정 등)" disabled={isSubmitting} />
      <input name="type" value={form.type} onChange={handleChange} placeholder="구분 (예: 행사, 공연 등)" disabled={isSubmitting} />
      <input name="place" value={form.place} onChange={handleChange} placeholder="장소 (미정 가능)" disabled={isSubmitting} />
      <input name="budget" value={form.budget} onChange={handleChange} placeholder="예산 (숫자)" type="number" disabled={form.budget_undecided || isSubmitting} />
      <input name="currency" value={form.currency} onChange={handleChange} placeholder="통화 (예: KRW, USD)" disabled={isSubmitting} />
      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input name="budget_undecided" type="checkbox" checked={form.budget_undecided} onChange={handleChange} disabled={isSubmitting} />
        예산 미정
      </label>
      <input name="email" value={form.email} onChange={handleChange} placeholder="이메일" disabled={isSubmitting} />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="연락처" disabled={isSubmitting} />
      <textarea name="message" value={form.message} onChange={handleChange} placeholder="문의사항" disabled={isSubmitting} />
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        style={{
          padding: "12px 24px",
          backgroundColor: isSubmitting ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          minHeight: "48px"
        }}
      >
        {isSubmitting ? (
          <>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #ffffff",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            전송 중...
          </>
        ) : (
          "문의 접수하기"
        )}
      </button>
      
      {status && (
        <div style={{
          padding: "12px",
          borderRadius: "4px",
          backgroundColor: status.includes("성공") ? "#d4edda" : status.includes("실패") || status.includes("오류") ? "#f8d7da" : "#d1ecf1",
          color: status.includes("성공") ? "#155724" : status.includes("실패") || status.includes("오류") ? "#721c24" : "#0c5460",
          border: `1px solid ${status.includes("성공") ? "#c3e6cb" : status.includes("실패") || status.includes("오류") ? "#f5c6cb" : "#bee5eb"}`,
          textAlign: "center",
          fontWeight: "500"
        }}>
          {status}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
} 