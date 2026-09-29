import React, { useState, useEffect } from 'react';
import {
  User, Phone, Save, Check, FileHeart, Stethoscope, AlertCircle, Sparkles, Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import type { Gender } from '../types';

export function PatientProfilePage() {
  const { profile, updateProfile, sessionType, user } = useAuth();
  const isDemo = sessionType === 'demo';

  const [formData, setFormData] = useState({
    fullName: isDemo ? 'Margaret Vance' : (profile?.fullName ?? ''),
    email: isDemo ? 'margaret.vance@example.com' : (profile?.email ?? user?.email ?? ''),
    phone: isDemo ? '+1 (555) 019-2834' : (profile?.phone ?? ''),
    patientName: isDemo ? 'Margaret Vance' : (profile?.patientName ?? ''),
    dateOfBirth: isDemo ? '1950-04-14' : (profile?.dateOfBirth ?? ''),
    gender: isDemo ? ('female' as Gender) : ((profile?.gender as Gender) ?? 'female'),
    bloodType: 'A+',
    height: '162 cm',
    weight: '64 kg',
    caregiverName: isDemo ? 'David Vance' : (profile?.caregiverName ?? ''),
    caregiverPhone: isDemo ? '+1 (555) 987-6543' : (profile?.caregiverPhone ?? ''),
    caregiverRelationship: isDemo ? 'Son (Primary Caregiver)' : (profile?.caregiverRelationship ?? ''),
    emergencyContactName: isDemo ? 'Dr. Gregory Roberts' : (profile?.emergencyContactName ?? ''),
    emergencyContactPhone: isDemo ? '+1 (555) 321-9988' : (profile?.emergencyContactPhone ?? ''),
    emergencyContactRelationship: isDemo ? 'Primary Physician' : (profile?.emergencyContactRelationship ?? ''),
    allergies: isDemo ? 'Penicillin (Severe rash)' : (profile?.allergies ?? ''),
    existingConditions: isDemo ? 'Mild Hypertension, Type 2 Controlled Diabetes' : (profile?.existingConditions ?? ''),
    medications: isDemo ? 'Lisinopril 10mg (morning), Metformin 500mg (bid), Atorvastatin 20mg (night)' : (profile?.medications ?? ''),
    medicalNotes: isDemo ? 'Patient prefers morning check-ins and uses a walking cane outdoors.' : (profile?.medicalNotes ?? ''),
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isDemo && profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.fullName ?? prev.fullName,
        email: profile.email ?? user?.email ?? prev.email,
        phone: profile.phone ?? prev.phone,
        patientName: profile.patientName ?? prev.patientName,
        dateOfBirth: profile.dateOfBirth ?? prev.dateOfBirth,
        gender: (profile.gender as Gender) ?? prev.gender,
        caregiverName: profile.caregiverName ?? prev.caregiverName,
        caregiverPhone: profile.caregiverPhone ?? prev.caregiverPhone,
        caregiverRelationship: profile.caregiverRelationship ?? prev.caregiverRelationship,
        emergencyContactName: profile.emergencyContactName ?? prev.emergencyContactName,
        emergencyContactPhone: profile.emergencyContactPhone ?? prev.emergencyContactPhone,
        emergencyContactRelationship: profile.emergencyContactRelationship ?? prev.emergencyContactRelationship,
        allergies: profile.allergies ?? prev.allergies,
        existingConditions: profile.existingConditions ?? prev.existingConditions,
        medications: profile.medications ?? prev.medications,
        medicalNotes: profile.medicalNotes ?? prev.medicalNotes,
      }));
    }
  }, [profile, isDemo, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (isDemo) {
      // In demo session, profile changes are local-only
      setTimeout(() => {
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }, 500);
      return;
    }

    const { error } = await updateProfile({
      fullName: formData.fullName,
      phone: formData.phone || null,
      patientName: formData.patientName || null,
      dateOfBirth: formData.dateOfBirth || null,
      gender: (formData.gender as Gender) || null,
      caregiverName: formData.caregiverName || null,
      caregiverPhone: formData.caregiverPhone || null,
      caregiverRelationship: formData.caregiverRelationship || null,
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      emergencyContactRelationship: formData.emergencyContactRelationship || null,
      allergies: formData.allergies || null,
      existingConditions: formData.existingConditions || null,
      medications: formData.medications || null,
      medicalNotes: formData.medicalNotes || null,
    });

    setLoading(false);
    if (error) {
      setErrorMessage(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo notice banner */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-800">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-amber-600 flex-shrink-0" />
            <span>
              <strong>Demo Session:</strong> You are viewing sample patient records for Margaret Vance. Any edits made here are temporary and will not persist across sessions.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <User size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isDemo ? 'Sample Patient Record' : 'Patient & Caregiver Master Profile'}
                </h1>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isDemo ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isDemo ? 'Demo Mode' : 'Personal Account'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Demographic records, designated emergency contacts, and baseline clinical profile
              </p>
            </div>
          </div>

          {saved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
              <Check size={14} />
              <span>{isDemo ? 'Saved (Simulation Preview)' : 'Profile Changes Saved'}</span>
            </div>
          )}

          {errorMessage && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileHeart size={16} className="text-blue-600" />
            Patient Demographics & Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Account Holder Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Patient Name (If Monitored Person is Different)</label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                placeholder="e.g. Margaret Vance"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Biological Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer Not To Say</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Account Email</label>
              <input
                type="email"
                name="email"
                disabled
                value={formData.email}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Caregiver & Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Phone size={16} className="text-indigo-600" />
            Caregiver & Emergency Escalation Contacts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Primary Caregiver Name</label>
              <input
                type="text"
                name="caregiverName"
                value={formData.caregiverName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Caregiver Relationship</label>
              <input
                type="text"
                name="caregiverRelationship"
                value={formData.caregiverRelationship}
                onChange={handleChange}
                placeholder="e.g. Son, Daughter, Nurse"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Caregiver Phone</label>
              <input
                type="tel"
                name="caregiverPhone"
                value={formData.caregiverPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                placeholder="e.g. Dr. Roberts Clinic or Neighbor"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Emergency Contact Relationship</label>
              <input
                type="text"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                placeholder="e.g. Physician, Sister"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Baseline Clinical Profile & Medications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Stethoscope size={16} className="text-teal-600" />
            Medical History, Daily Medications & Drug Allergies
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Known Diagnosed Chronic Conditions</label>
              <input
                type="text"
                name="existingConditions"
                value={formData.existingConditions}
                onChange={handleChange}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Osteoarthritis"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Current Daily Medications & Regimen</label>
              <textarea
                name="medications"
                rows={2}
                value={formData.medications}
                onChange={handleChange}
                placeholder="e.g. Lisinopril 10mg (morning), Metformin 500mg (bid)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Known Drug Allergies & Adverse Reactions</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Penicillin (severe rash), Sulfa drugs"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">General Medical & Mobility Notes</label>
              <textarea
                name="medicalNotes"
                rows={2}
                value={formData.medicalNotes}
                onChange={handleChange}
                placeholder="Any special notes for emergency dispatchers or caregivers..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Save size={14} />
            <span>{loading ? 'Saving Updates…' : isDemo ? 'Save Demo Profile' : 'Save Patient Profile'}</span>
          </button>
        </div>
      </form>

      <MedicalDisclaimer />
    </div>
  );
}
