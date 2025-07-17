"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import Header from "../../../components/Header";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, loading } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자가 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      console.log('User already logged in, redirecting...', user);
      if (user.role === 'admin') {
        router.push("/admin/artists");
      } else if (user.role === 'choreographer') {
        router.push("/choreographer/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login with email:', form.email);
      const { user: authUser, error } = await signIn(form.email, form.password);
      
      if (error) {
        console.error('Login error:', error);
        setError(error.message || "로그인에 실패했습니다.");
      } else if (authUser) {
        console.log('Login successful, waiting for user state update...');
        // 로그인 성공 시 잠시 대기 후 리다이렉트
        setTimeout(() => {
          console.log('Redirecting after login...');
          if (user?.role === 'admin') {
            router.push("/admin/artists");
          } else if (user?.role === 'choreographer') {
            router.push("/choreographer/dashboard");
          } else {
            router.push("/dashboard");
          }
        }, 500);
      }
    } catch (error) {
      console.error('Login exception:', error);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  // 로딩 중이거나 이미 로그인된 사용자라면 로딩 화면 표시
  if (loading) {
    return (
      <>
        <Header title="로그인" />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>로딩 중...</p>
          </div>
        </div>
      </>
    );
  }

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
            <button type="submit" className="w-full bg-white text-black py-2 rounded font-bold hover:bg-white/90 transition-colors" disabled={loginLoading}>
              {loginLoading ? "로그인 중..." : "로그인"}
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