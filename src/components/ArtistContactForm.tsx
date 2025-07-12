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
    setStatus("전송 중...");
    const sendData = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, String(v)]));
    if (sendData.budget_undecided === "true") sendData.budget = "";
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
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <input name="artist_name" value={form.artist_name} onChange={handleChange} placeholder="아티스트명" required />
      <input name="manager_name" value={form.manager_name} onChange={handleChange} placeholder="담당자명" required />
      <input name="start_date" value={form.start_date} onChange={handleChange} placeholder="시작일정 (YYYY-MM-DD)" />
      <input name="end_date" value={form.end_date} onChange={handleChange} placeholder="종료일정 (YYYY-MM-DD)" />
      <input name="approximate_date" value={form.approximate_date} onChange={handleChange} placeholder="대략 일정/미정 (예: 6월 중순, 미정 등)" />
      <input name="type" value={form.type} onChange={handleChange} placeholder="구분 (예: 행사, 공연 등)" />
      <input name="place" value={form.place} onChange={handleChange} placeholder="장소 (미정 가능)" />
      <input name="budget" value={form.budget} onChange={handleChange} placeholder="예산 (숫자)" type="number" disabled={form.budget_undecided} />
      <input name="currency" value={form.currency} onChange={handleChange} placeholder="통화 (예: KRW, USD)" />
      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input name="budget_undecided" type="checkbox" checked={form.budget_undecided} onChange={handleChange} />
        예산 미정
      </label>
      <input name="email" value={form.email} onChange={handleChange} placeholder="이메일" />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="연락처" />
      <textarea name="message" value={form.message} onChange={handleChange} placeholder="문의사항" />
      <button type="submit">문의 접수하기</button>
      <div>{status}</div>
    </form>
  );
} 