"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import Header from "../../../components/Header";

const roleOptions = [
  { value: "general", label: "일반회원" },
  { value: "client", label: "클라이언트" },
  { value: "partner_choreographer", label: "파트너댄서" },
];

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    pending_role: 'general' // 기본값을 general로 변경
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const { user, error } = await signUp(formData.email, formData.password, formData.name, formData.phone, formData.pending_role);
      if (error) {
        setError(error.message || "회원가입에 실패했습니다.");
      } else if (user) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 1500);
      }
    } catch (error) {
      setError("회원가입 중 오류가 발생했습니다.");
    }
    
    setLoading(false);
  };

  return (
    <>
      <Header title="회원가입" />
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto py-16 px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">회원가입</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 font-semibold">이메일</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border rounded px-3 py-2 bg-white/10 text-white border-white/20" />
            </div>
            <div>
              <label className="block mb-1 font-semibold">비밀번호</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full border rounded px-3 py-2 bg-white/10 text-white border-white/20" />
            </div>
            <div>
              <label className="block mb-1 font-semibold">이름</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded px-3 py-2 bg-white/10 text-white border-white/20" />
            </div>
            <div>
              <label className="block mb-1 font-semibold">전화번호</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-white/10 text-white border-white/20" />
            </div>
            <div>
              <label className="block mb-1 font-semibold">회원 유형</label>
              <select name="pending_role" value={formData.pending_role} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-white/10 text-white border-white/20">
                {roleOptions.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-white text-black py-2 rounded font-bold hover:bg-white/90 transition-colors" disabled={loading}>
              {loading ? "가입 중..." : "회원가입"}
            </button>
            {error && <div className="text-red-400 text-center mt-2">{error}</div>}
            {success && <div className="text-green-400 text-center mt-2">회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.</div>}
          </form>
        </div>
      </div>
    </>
  );
} 