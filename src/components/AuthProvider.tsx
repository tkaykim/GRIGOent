'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, AuthUser } from '../utils/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, name?: string, phone?: string, role?: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 사용자 상태 확인 - 세션 먼저 확인
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { user: currentUser, error } = await getCurrentUser();
          if (!error && currentUser) {
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Supabase 인증 상태 변경 리스너 - 최적화
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { user: currentUser, error } = await getCurrentUser();
          if (!error && currentUser) {
            setUser(currentUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authData.user && !error) {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    }

    return { user: authData.user, error };
  };

  const signUp = async (email: string, password: string, name?: string, phone?: string, role?: string) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        }
      }
    });

    if (authData.user && !error) {
      // public.users 테이블에 사용자 정보 저장
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          phone,
          role: role || 'client' // 선택된 권한 사용
        });

      if (!profileError) {
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser);
      }
    }

    return { user: authData.user, error };
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider signOut 시작...');
      console.log('현재 사용자:', user);
      
      const { error } = await supabase.auth.signOut();
      console.log('Supabase signOut 결과:', { error });
      
      if (!error) {
        setUser(null);
        console.log('로그아웃 성공 - 사용자 상태 초기화됨');
      } else {
        console.error('로그아웃 오류:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('로그아웃 예외:', error);
      setUser(null); // 강제로 사용자 상태 초기화
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 