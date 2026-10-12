-- ==============================================================================
-- MIGRATION: 20261012200000_create_sensor_readings.sql
-- Description: Creates the public.sensor_readings table with Row Level Security (RLS)
--              for patient vital signs telemetry and manual vitals check-ins.
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the public.sensor_readings table
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

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Strictly scoped to the authenticated user ID
DROP POLICY IF EXISTS "Users can view own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can view own sensor readings"
  ON public.sensor_readings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can insert own sensor readings"
  ON public.sensor_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can update own sensor readings"
  ON public.sensor_readings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sensor readings" ON public.sensor_readings;
CREATE POLICY "Users can delete own sensor readings"
  ON public.sensor_readings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Indexes for performant user queries and longitudinal chronological sorting
CREATE INDEX IF NOT EXISTS idx_sensor_readings_user_timestamp
  ON public.sensor_readings (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_source
  ON public.sensor_readings (user_id, source);

-- 6. Table Grants
GRANT ALL ON public.sensor_readings TO authenticated;
GRANT ALL ON public.sensor_readings TO service_role;

-- 7. Force refresh the PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
