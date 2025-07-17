'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { AuthUser } from '../utils/auth';

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

  // 사용자 정보를 가져오는 함수
  const fetchUser = async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // 먼저 public.users 테이블에서 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      console.log('Fetching user data from public.users:', userData, 'Error:', userError);
      
      if (!userError && userData) {
        const authUserData: AuthUser = {
          id: userData.id,
          email: userData.email || '',
          name: userData.name || undefined,
          role: userData.role || 'general',
          phone: userData.phone || undefined,
          created_at: userData.created_at || undefined,
          pending_role: userData.pending_role || undefined,
        };
        
        console.log('Setting user state:', authUserData);
        setUser(authUserData);
      } else {
        console.log('Failed to get user from public.users, error:', userError);
        // public.users에 사용자가 없으면 로그아웃 처리
        if (userError && userError.code === 'PGRST116') {
          console.log('User not found in public.users, signing out...');
          await signOut();
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 초기 사용자 상태 확인
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session);
        
        if (session?.user) {
          await fetchUser(session.user);
        } else {
          console.log('No initial session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking initial user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Supabase 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('User signed in, fetching user data...');
            await fetchUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('Token refreshed, updating user data...');
            await fetchUser(session.user);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in with email:', email);
      
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

      console.log('Sign in result:', { user: authData.user, error });

    if (authData.user && !error) {
        // 로그인 성공 시 즉시 사용자 정보 가져오기
        console.log('Login successful, fetching user data...');
        await fetchUser(authData.user);
    }

    return { user: authData.user, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, name?: string, phone?: string, pending_role?: string) => {
    try {
      console.log('Signing up with email:', email);
      
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            pending_role,
          }
        }
      });

      console.log('Sign up result:', { user: authData.user, error });

      if (authData.user && !error) {
        // 트리거가 자동으로 public.users에 사용자 정보를 생성하므로
        // 잠시 기다린 후 사용자 정보를 가져옴
        console.log('User created successfully, waiting for trigger...');
        setTimeout(async () => {
          await fetchUser(authData.user);
        }, 1000);
      }

      return { user: authData.user, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider signOut 시작...');
      console.log('현재 사용자:', user);
      
      // 먼저 로컬 상태를 초기화
      setUser(null);
      
      // Supabase 로그아웃 실행
      const { error } = await supabase.auth.signOut();
      console.log('Supabase signOut 결과:', { error });
      
      if (error) {
        console.error('Supabase 로그아웃 오류:', error);
        // 에러가 발생해도 로컬 상태는 이미 초기화됨
      } else {
        console.log('로그아웃 성공 - 사용자 상태 초기화됨');
      }
      
      return { error };
    } catch (error) {
      console.error('로그아웃 예외:', error);
      // 예외가 발생해도 로컬 상태 초기화
      setUser(null);
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