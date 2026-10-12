-- ==============================================================================
-- AI SMART ELDERLY HEALTH MONITORING & EMERGENCY ASSISTANCE SYSTEM
-- COMPREHENSIVE SUPABASE DATABASE MIGRATION WITH ROW LEVEL SECURITY (RLS)
-- File: supabase/migrations/20261012200001_full_system_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: profiles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  patient_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  patient_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  caregiver_name TEXT,
  caregiver_phone TEXT,
  caregiver_relationship TEXT,
  medical_notes TEXT,
  allergies TEXT,
  existing_conditions TEXT,
  medications TEXT,
  emergency_contact TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ==============================================================================
-- 3. TABLE: devices
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL DEFAULT 'HealthGuard IoT Monitor',
  device_type TEXT NOT NULL DEFAULT 'raspberry_pi' CHECK (device_type IN ('raspberry_pi', 'esp32', 'demo')),
  connection_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'connecting')),
  device_id TEXT NOT NULL,
  firmware_version TEXT DEFAULT 'v1.0.0',
  location TEXT DEFAULT 'Home',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
CREATE POLICY "Users can view own devices"
  ON public.devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own devices" ON public.devices;
CREATE POLICY "Users can insert own devices"
  ON public.devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own devices" ON public.devices;
CREATE POLICY "Users can update own devices"
  ON public.devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own devices" ON public.devices;
CREATE POLICY "Users can delete own devices"
  ON public.devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT ALL ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;

-- ==============================================================================
-- 4. TABLE: sensor_readings
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT DEFAULT 'manual-entry',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  heart_rate NUMERIC,
  spo2 NUMERIC,
  temperature NUMERIC,
  systolic_bp NUMERIC,
  diastolic_bp NUMERIC,
  motion_status TEXT DEFAULT 'normal' CHECK (motion_status IN ('normal', 'elevated', 'fall_detected', 'inactive')),
  accelerometer_x NUMERIC,
  accelerometer_y NUMERIC,
  accelerometer_z NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  source TEXT NOT NULL DEFAULT 'sensor' CHECK (source IN ('sensor', 'demo', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can view own sensor readings"
  ON public.sensor_readings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can insert own sensor readings"
  ON public.sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can update own sensor readings"
  ON public.sensor_readings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can delete own sensor readings"
  ON public.sensor_readings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_user_timestamp
  ON public.sensor_readings (user_id, timestamp DESC);

GRANT ALL ON public.sensor_readings TO authenticated;
GRANT ALL ON public.sensor_readings TO service_role;

-- ==============================================================================
-- 5. TABLE: health_alerts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'high_risk', 'critical')),
  parameter TEXT NOT NULL,
  value TEXT NOT NULL,
  message TEXT NOT NULL,
  risk_score NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unacknowledged' CHECK (status IN ('unacknowledged', 'acknowledged', 'resolved')),
  source TEXT NOT NULL DEFAULT 'sensor',
  latitude NUMERIC,
  longitude NUMERIC,
  explanation TEXT,
  observed_factors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own alerts" ON public.health_alerts;
CREATE POLICY "Users can view own alerts"
  ON public.health_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own alerts" ON public.health_alerts;
CREATE POLICY "Users can insert own alerts"
  ON public.health_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON public.health_alerts;
CREATE POLICY "Users can update own alerts"
  ON public.health_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_health_alerts_user_status
  ON public.health_alerts (user_id, status);

GRANT ALL ON public.health_alerts TO authenticated;
GRANT ALL ON public.health_alerts TO service_role;

-- ==============================================================================
-- 6. TABLE: patient_reports
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patient_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'general_health',
  file_path TEXT,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_date DATE,
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'complete', 'failed')),
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'complete', 'failed')),
  data_quality TEXT NOT NULL DEFAULT 'high' CHECK (data_quality IN ('high', 'moderate', 'low', 'unknown')),
  parameter_count INTEGER DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own patient reports" ON public.patient_reports;
CREATE POLICY "Users can view own patient reports"
  ON public.patient_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own patient reports" ON public.patient_reports;
CREATE POLICY "Users can insert own patient reports"
  ON public.patient_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own patient reports" ON public.patient_reports;
CREATE POLICY "Users can update own patient reports"
  ON public.patient_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own patient reports" ON public.patient_reports;
CREATE POLICY "Users can delete own patient reports"
  ON public.patient_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT ALL ON public.patient_reports TO authenticated;
GRANT ALL ON public.patient_reports TO service_role;

-- ==============================================================================
-- 7. TABLE: report_parameters
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.patient_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  reference_range TEXT,
  extracted_text TEXT,
  extraction_confidence TEXT DEFAULT 'high',
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'abnormal', 'borderline', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.report_parameters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own report parameters" ON public.report_parameters;
CREATE POLICY "Users can view own report parameters"
  ON public.report_parameters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own report parameters" ON public.report_parameters;
CREATE POLICY "Users can insert own report parameters"
  ON public.report_parameters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own report parameters" ON public.report_parameters;
CREATE POLICY "Users can delete own report parameters"
  ON public.report_parameters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT ALL ON public.report_parameters TO authenticated;
GRANT ALL ON public.report_parameters TO service_role;

-- ==============================================================================
-- 8. AUTOMATIC PROFILE TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 9. REFRESH SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
