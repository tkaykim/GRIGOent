import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  phone?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// 회원가입
export async function signUp(data: SignUpData) {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
        }
      }
    });

    if (error) throw error;

    // public.users 테이블에 사용자 정보 저장
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: 'client'
        });

      if (profileError) throw profileError;
    }

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

// 로그인
export async function signIn(data: SignInData) {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

// 로그아웃
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// 현재 사용자 가져오기
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (user) {
      // public.users 테이블에서 추가 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        user: {
          ...user,
          ...profile
        },
        error: null
      };
    }

    return { user: null, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

// 사용자 세션 가져오기
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    return { session: null, error };
  }
}

// 비밀번호 재설정
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// 사용자 정보 업데이트
export async function updateProfile(userId: string, updates: Partial<AuthUser>) {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
} 