import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'owner' | 'manager' | 'waiter' | 'kitchen' | 'cashier';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  pinLogin: (email: string, pin: string) => Promise<{ error: string | null }>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadRoles(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadRoles = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const safeRole: AppRole = role === 'super_admin' || role === 'owner' ? 'waiter' : role;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, role: safeRole },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const pinLogin = async (email: string, pin: string) => {
    const { data, error } = await supabase.functions.invoke('pin-login', {
      body: { email, pin },
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    if (data?.access_token && data?.refresh_token) {
      const { error: serr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return { error: serr?.message ?? null };
    }
    return { error: 'Невірна відповідь сервера' };
  };

  return (
    <Ctx.Provider value={{ user, session, roles, loading, signIn, signUp, signOut, pinLogin }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};

export const roleToZone = (roles: AppRole[]): string => {
  if (roles.includes('super_admin') || roles.includes('owner') || roles.includes('manager')) return '/admin';
  if (roles.includes('kitchen')) return '/kitchen';
  if (roles.includes('cashier') || roles.includes('waiter')) return '/waiter';
  return '/';
};

export const canAccessZone = (zone: 'waiter' | 'kitchen' | 'admin', roles: AppRole[]): boolean => {
  if (roles.includes('super_admin') || roles.includes('owner')) return true;
  if (zone === 'admin') return roles.includes('manager');
  if (zone === 'kitchen') return roles.includes('kitchen') || roles.includes('manager');
  if (zone === 'waiter') return roles.includes('waiter') || roles.includes('cashier') || roles.includes('manager');
  return false;
};
