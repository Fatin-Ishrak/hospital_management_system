// LOGIN STATE: keeps the Supabase session, loads the profile/doctor/patient record, and offers signIn, signUp and signOut.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/core/supabase/client.js';
import { authApi } from '@/core/auth/authApi.js';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const EMPTY = { profile: null, doctor: null, patient: null, error: null };

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [ctx, setCtx] = useState(EMPTY);
  const [loadedFor, setLoadedFor] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  const load = useCallback(async () => {
    if (!userId) {
      setCtx(EMPTY);
      setLoadedFor(null);
      return;
    }
    try {
      const profile = await authApi.profile(userId);
      let doctor = null;
      let patient = null;
      if (profile?.role === 'doctor') doctor = await authApi.myDoctor(userId);
      if (profile?.role === 'patient') patient = await authApi.myPatient(userId);
      setCtx({ profile, doctor, patient, error: null });
    } catch (error) {
      setCtx({ ...EMPTY, error });
    }
    setLoadedFor(userId);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      ...ctx,
      role: ctx.profile?.role ?? null,
      loading: booting || (Boolean(userId) && loadedFor !== userId),
      refresh: load,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, data) => {
        const { data: res, error } = await supabase.auth.signUp({ email, password, options: { data } });
        if (error) throw error;
        return res;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, ctx, booting, userId, loadedFor, load]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
