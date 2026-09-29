import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, mapAuthError } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

export type SessionType = 'demo' | 'real' | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  supabaseReady: boolean;
  sessionType: SessionType;
  // Demo session
  enterDemoSession: () => void;
  exitDemoSession: () => void;
  // Real auth
  signUp: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapDatabaseRowToProfile(row: Record<string, any>): UserProfile {
  return {
    id: row.id,
    email: row.email || '',
    fullName: row.full_name || row.fullName || '',
    phone: row.phone ?? null,
    patientName: row.patient_name ?? row.patientName ?? null,
    dateOfBirth: row.date_of_birth ?? row.dateOfBirth ?? null,
    gender: row.gender ?? null,
    patientPhone: row.patient_phone ?? row.patientPhone ?? null,
    emergencyContactName: row.emergency_contact_name ?? row.emergencyContactName ?? null,
    emergencyContactPhone: row.emergency_contact_phone ?? row.emergencyContactPhone ?? null,
    emergencyContactRelationship: row.emergency_contact_relationship ?? row.emergencyContactRelationship ?? null,
    caregiverName: row.caregiver_name ?? row.caregiverName ?? null,
    caregiverPhone: row.caregiver_phone ?? row.caregiverPhone ?? null,
    caregiverRelationship: row.caregiver_relationship ?? row.caregiverRelationship ?? null,
    medicalNotes: row.medical_notes ?? row.medicalNotes ?? null,
    allergies: row.allergies ?? null,
    existingConditions: row.existing_conditions ?? row.existingConditions ?? null,
    medications: row.medications ?? null,
    emergencyContact: row.emergency_contact ?? null,
    deviceId: row.device_id ?? row.deviceId ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const supabaseReady = isSupabaseConfigured();

  const loadProfile = async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error loading user profile from Supabase:', error.message);
        return;
      }

      if (data) {
        setProfile(mapDatabaseRowToProfile(data));
      }
    } catch (err) {
      console.warn('Profile fetch exception:', err);
    }
  };

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
        setSessionType('real');
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
          setSessionType('real');
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabaseReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Demo session (in-memory simulation, no Supabase account created) ─────────
  const enterDemoSession = () => {
    setSessionType('demo');
  };

  const exitDemoSession = () => {
    setSessionType(null);
  };

  // ── Real authentication ─────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    profileData: Partial<UserProfile>
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured. Please check the application environment settings.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: profileData.fullName ?? '',
            phone: profileData.phone ?? '',
          },
        },
      });

      if (error) {
        return { error: mapAuthError(error) };
      }

      if (!data.user) {
        return { error: 'Unable to connect to the authentication service. Please try again.' };
      }

      // Upsert profile record linked to auth.users id
      const dbPayload = {
        id: data.user.id,
        email: cleanEmail,
        full_name: profileData.fullName ?? '',
        phone: profileData.phone ?? null,
        patient_name: profileData.patientName ?? null,
        date_of_birth: profileData.dateOfBirth ?? null,
        gender: profileData.gender ?? null,
        patient_phone: profileData.patientPhone ?? null,
        emergency_contact_name: profileData.emergencyContactName ?? null,
        emergency_contact_phone: profileData.emergencyContactPhone ?? null,
        emergency_contact_relationship: profileData.emergencyContactRelationship ?? null,
        caregiver_name: profileData.caregiverName ?? null,
        caregiver_phone: profileData.caregiverPhone ?? null,
        caregiver_relationship: profileData.caregiverRelationship ?? null,
        medical_notes: profileData.medicalNotes ?? null,
        allergies: profileData.allergies ?? null,
        existing_conditions: profileData.existingConditions ?? null,
        medications: profileData.medications ?? null,
        device_id: null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(dbPayload, { onConflict: 'id' });

      if (profileError) {
        console.warn('Profile upsert warning:', profileError.message);
      }

      // Immediate in-memory state setup
      const localProfile = mapDatabaseRowToProfile(dbPayload);
      setUser(data.user);
      setSession(data.session);
      setProfile(localProfile);
      setSessionType('real');

      return { error: null };
    } catch (err: unknown) {
      return { error: mapAuthError(err) };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured. Please check the application environment settings.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { error: mapAuthError(error) };
      }

      if (!data.user) {
        return { error: 'Unable to connect to the authentication service. Please try again.' };
      }

      setUser(data.user);
      setSession(data.session);
      setSessionType('real');
      await loadProfile(data.user.id);

      return { error: null };
    } catch (err: unknown) {
      return { error: mapAuthError(err) };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore sign-out network exceptions
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setSessionType(null);
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated.' };
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured. Please check the application environment settings.' };
    }

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.patientName !== undefined) dbUpdates.patient_name = updates.patientName;
      if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.patientPhone !== undefined) dbUpdates.patient_phone = updates.patientPhone;
      if (updates.emergencyContactName !== undefined) dbUpdates.emergency_contact_name = updates.emergencyContactName;
      if (updates.emergencyContactPhone !== undefined) dbUpdates.emergency_contact_phone = updates.emergencyContactPhone;
      if (updates.emergencyContactRelationship !== undefined) dbUpdates.emergency_contact_relationship = updates.emergencyContactRelationship;
      if (updates.caregiverName !== undefined) dbUpdates.caregiver_name = updates.caregiverName;
      if (updates.caregiverPhone !== undefined) dbUpdates.caregiver_phone = updates.caregiverPhone;
      if (updates.caregiverRelationship !== undefined) dbUpdates.caregiver_relationship = updates.caregiverRelationship;
      if (updates.medicalNotes !== undefined) dbUpdates.medical_notes = updates.medicalNotes;
      if (updates.allergies !== undefined) dbUpdates.allergies = updates.allergies;
      if (updates.existingConditions !== undefined) dbUpdates.existing_conditions = updates.existingConditions;
      if (updates.medications !== undefined) dbUpdates.medications = updates.medications;
      if (updates.deviceId !== undefined) dbUpdates.device_id = updates.deviceId;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) return { error: mapAuthError(error) };
      await loadProfile(user.id);
      return { error: null };
    } catch (err: unknown) {
      return { error: mapAuthError(err) };
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, supabaseReady, sessionType,
      enterDemoSession, exitDemoSession,
      signUp, signIn, signOut, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
