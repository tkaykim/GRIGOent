"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import Header from "../../../components/Header";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { user, error } = await signIn(form.email, form.password);
    if (error) {
      setError(error.message || "로그인에 실패했습니다.");
    } else if (user) {
      // 권한에 따라 다른 페이지로 이동
      if (user.role === 'admin') {
        router.push("/admin/artists");
      } else if (user.role === 'choreographer') {
        router.push("/choreographer/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Header title="로그인" />
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto py-16 px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">로그인</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 font-semibold">이메일</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border rounded px-3 py-2 bg-white/10 text-white border-white/20" />
            </div>
            <div>
              <label className="block mb-1 font-semibold">비밀번호</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full border rounded px-3 py-2 bg-white/10 text-white border-white/20" />
            </div>
            <button type="submit" className="w-full bg-white text-black py-2 rounded font-bold hover:bg-white/90 transition-colors" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
            {error && <div className="text-red-400 text-center mt-2">{error}</div>}
          </form>
          <div className="text-center mt-4">
            <a href="/auth/signup" className="text-blue-400 hover:underline">회원가입</a>
          </div>
        </div>
      </div>
    </>
  );
} 