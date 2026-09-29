import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Lock, Mail, User, Phone, ShieldCheck, AlertCircle,
  ArrowRight, ArrowLeft, CheckCircle2, Contact, UserCog,
  Stethoscope, KeyRound,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Gender } from '../types';

// ── Step data ─────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Account
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  // Step 2 — Patient info
  patientName: string;
  dateOfBirth: string;
  gender: Gender | '';
  patientPhone: string;
  // Step 3 — Emergency contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  // Step 4 — Caregiver
  caregiverName: string;
  caregiverPhone: string;
  caregiverRelationship: string;
  // Step 5 — Health profile (all optional)
  medicalNotes: string;
  allergies: string;
  existingConditions: string;
  medications: string;
}

const INITIAL: FormData = {
  fullName: '', email: '', password: '', confirmPassword: '', phone: '',
  patientName: '', dateOfBirth: '', gender: '', patientPhone: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '',
  caregiverName: '', caregiverPhone: '', caregiverRelationship: '',
  medicalNotes: '', allergies: '', existingConditions: '', medications: '',
};

const STEPS = [
  { title: 'Account Information', icon: KeyRound, description: 'Create your login credentials' },
  { title: 'Patient Information', icon: User, description: 'About the person being monitored' },
  { title: 'Emergency Contact', icon: Contact, description: 'Who to call in an emergency' },
  { title: 'Caregiver Details', icon: UserCog, description: 'Primary caregiver information' },
  { title: 'Health Profile', icon: Stethoscope, description: 'Optional health background' },
];

// ── Input component ───────────────────────────────────────────────────────────

function Field({
  label, required, hint, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required ? (
          <span className="text-red-500 ml-1">*</span>
        ) : (
          <span className="ml-1 text-slate-400 font-normal">(optional)</span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400";
const textareaCls = "w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 resize-none";
const selectCls = "w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800";
const iconCls = "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400";

// ── Main component ────────────────────────────────────────────────────────────

export function SignupPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signUp, supabaseReady } = useAuth();
  const navigate = useNavigate();

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.fullName.trim()) return 'Full name is required.';
      if (!form.email.trim()) return 'Email is required.';
      if (!form.password || form.password.length < 6) return 'Please use a stronger password.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    if (step === 1) {
      if (!form.patientName.trim()) return 'Patient name is required.';
    }
    if (step === 2) {
      if (!form.emergencyContactName.trim()) return 'Emergency contact name is required.';
      if (!form.emergencyContactPhone.trim()) return 'Emergency contact phone is required.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const back = () => { setError(null); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    if (!supabaseReady) {
      setLoading(false);
      setError('Supabase is not configured. Please check the application environment settings.');
      return;
    }

    const { error: signUpError } = await signUp(form.email, form.password, {
      fullName: form.fullName,
      phone: form.phone || null,
      patientName: form.patientName || null,
      dateOfBirth: form.dateOfBirth || null,
      gender: (form.gender as Gender) || null,
      patientPhone: form.patientPhone || null,
      emergencyContactName: form.emergencyContactName || null,
      emergencyContactPhone: form.emergencyContactPhone || null,
      emergencyContactRelationship: form.emergencyContactRelationship || null,
      caregiverName: form.caregiverName || null,
      caregiverPhone: form.caregiverPhone || null,
      caregiverRelationship: form.caregiverRelationship || null,
      medicalNotes: form.medicalNotes || null,
      allergies: form.allergies || null,
      existingConditions: form.existingConditions || null,
      medications: form.medications || null,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError);
    } else {
      navigate('/complete-profile', { state: { name: form.patientName || form.fullName } });
    }
  };

  const StepIcon = STEPS[step].icon;
  const progress = ((step) / (STEPS.length)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">HealthGuard AI</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create Your Real Account</h2>
        <p className="mt-1 text-sm text-slate-500">Set up your personal health monitoring profile</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex flex-col items-center ${i <= step ? 'text-blue-600' : 'text-slate-300'} transition-colors`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < step
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : i === step
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className="hidden sm:block text-[10px] mt-1 font-medium max-w-[70px] text-center leading-tight">
                  {s.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-100">
          {/* Step header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <StepIcon size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{STEPS[step].title}</h3>
              <p className="text-xs text-slate-500">{STEPS[step].description}</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 0: Account Info ──────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Your Full Name" required>
                <div className="relative">
                  <div className={iconCls}><User size={15} /></div>
                  <input type="text" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Sahana Gowda" className={inputCls} />
                </div>
              </Field>
              <Field label="Email Address" required>
                <div className="relative">
                  <div className={iconCls}><Mail size={15} /></div>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputCls} />
                </div>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Password" required hint="Minimum 6 characters">
                  <div className="relative">
                    <div className={iconCls}><Lock size={15} /></div>
                    <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" minLength={6} className={inputCls} />
                  </div>
                </Field>
                <Field label="Confirm Password" required>
                  <div className="relative">
                    <div className={iconCls}><Lock size={15} /></div>
                    <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" className={inputCls} />
                  </div>
                </Field>
              </div>
              <Field label="Phone Number">
                <div className="relative">
                  <div className={iconCls}><Phone size={15} /></div>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 1: Patient Info ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                <p className="font-semibold mb-0.5">Who is being monitored?</p>
                <p>This is the elderly patient whose health data will be tracked.</p>
              </div>
              <Field label="Patient Full Name" required>
                <div className="relative">
                  <div className={iconCls}><User size={15} /></div>
                  <input type="text" value={form.patientName} onChange={set('patientName')} placeholder="e.g. Radha Gowda" className={inputCls} />
                </div>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of Birth">
                  <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800" />
                </Field>
                <Field label="Gender">
                  <div className="relative">
                    <div className={iconCls}><User size={15} /></div>
                    <select value={form.gender} onChange={set('gender')} className={selectCls}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </Field>
              </div>
              <Field label="Patient Phone Number">
                <div className="relative">
                  <div className={iconCls}><Phone size={15} /></div>
                  <input type="tel" value={form.patientPhone} onChange={set('patientPhone')} placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 2: Emergency Contact ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700">
                <p className="font-semibold mb-0.5">This is critical information</p>
                <p>Emergency contacts are notified when critical health events are detected.</p>
              </div>
              <Field label="Emergency Contact Name" required>
                <div className="relative">
                  <div className={iconCls}><User size={15} /></div>
                  <input type="text" value={form.emergencyContactName} onChange={set('emergencyContactName')} placeholder="e.g. Ravi Gowda" className={inputCls} />
                </div>
              </Field>
              <Field label="Emergency Contact Phone" required>
                <div className="relative">
                  <div className={iconCls}><Phone size={15} /></div>
                  <input type="tel" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </Field>
              <Field label="Relationship to Patient" required>
                <div className="relative">
                  <div className={iconCls}><Contact size={15} /></div>
                  <input type="text" value={form.emergencyContactRelationship} onChange={set('emergencyContactRelationship')} placeholder="e.g. Son, Daughter, Spouse" className={inputCls} />
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 3: Caregiver ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs text-teal-700">
                <p className="font-semibold mb-0.5">Primary caregiver details</p>
                <p>The caregiver receives daily health summaries and non-critical alerts. You can skip this step if not applicable.</p>
              </div>
              <Field label="Caregiver Full Name">
                <div className="relative">
                  <div className={iconCls}><UserCog size={15} /></div>
                  <input type="text" value={form.caregiverName} onChange={set('caregiverName')} placeholder="e.g. Priya Gowda" className={inputCls} />
                </div>
              </Field>
              <Field label="Caregiver Phone">
                <div className="relative">
                  <div className={iconCls}><Phone size={15} /></div>
                  <input type="tel" value={form.caregiverPhone} onChange={set('caregiverPhone')} placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </Field>
              <Field label="Relationship to Patient">
                <div className="relative">
                  <div className={iconCls}><Contact size={15} /></div>
                  <input type="text" value={form.caregiverRelationship} onChange={set('caregiverRelationship')} placeholder="e.g. Daughter, Home Nurse" className={inputCls} />
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 4: Health Profile ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-700">
                <p className="font-semibold mb-0.5">All fields are optional</p>
                <p>This information helps the AI provide more relevant health insights. You can add or edit this later from your profile.</p>
              </div>
              <Field label="Medical Notes">
                <textarea value={form.medicalNotes} onChange={set('medicalNotes')} placeholder="e.g. Hypertension patient, previous cardiac surgery in 2019..." rows={2} className={textareaCls} />
              </Field>
              <Field label="Known Allergies">
                <textarea value={form.allergies} onChange={set('allergies')} placeholder="e.g. Penicillin, Sulfa drugs, Peanuts..." rows={2} className={textareaCls} />
              </Field>
              <Field label="Existing Conditions">
                <textarea value={form.existingConditions} onChange={set('existingConditions')} placeholder="e.g. Type 2 Diabetes, Hypertension, Arthritis..." rows={2} className={textareaCls} />
              </Field>
              <Field label="Current Medications">
                <textarea value={form.medications} onChange={set('medications')} placeholder="e.g. Metformin 500mg, Amlodipine 5mg..." rows={2} className={textareaCls} />
              </Field>
            </div>
          )}

          {/* ── Navigation buttons ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 mt-8 pt-4 border-t border-slate-100">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                Continue
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Complete Registration
                  </>
                )}
              </button>
            )}
          </div>

          {step === STEPS.length - 1 && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Health information fields above are optional and can be edited anytime
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
              Sign in
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Your data is encrypted and stored securely</span>
          </div>
        </div>
      </div>
    </div>
  );
}
