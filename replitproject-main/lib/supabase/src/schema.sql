-- ============================================================
-- Company AI Management System — Supabase Schema
-- Run this file in your Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  role TEXT,
  status TEXT DEFAULT 'active',
  face_descriptor JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance (face/geo/manual)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  method TEXT DEFAULT 'manual',    -- 'face' | 'geo' | 'manual' | 'wfh'
  latitude FLOAT,
  longitude FLOAT,
  face_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'present',   -- 'present' | 'absent' | 'late'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,        -- 'sick' | 'casual' | 'annual' | 'maternity'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',   -- 'pending' | 'approved' | 'rejected'
  ai_recommendation TEXT,
  ai_reason TEXT,
  unusual_pattern BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATS / Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT,
  job_role TEXT,
  ats_score INTEGER DEFAULT 0,
  verdict TEXT DEFAULT 'review',   -- 'shortlisted' | 'rejected' | 'review'
  matched_skills JSONB,
  missing_skills JSONB,
  experience_years FLOAT,
  summary TEXT,
  candidate_name TEXT,
  candidate_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview Sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT,
  role TEXT,
  questions JSONB,
  answers JSONB,
  total_score FLOAT,
  status TEXT DEFAULT 'active',    -- 'active' | 'completed' | 'disqualified'
  disqualify_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Logs
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_number TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Logs (LinkedIn / social)
CREATE TABLE IF NOT EXISTS post_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_text TEXT,
  image_url TEXT,
  platform TEXT DEFAULT 'linkedin',
  status TEXT DEFAULT 'draft',     -- 'draft' | 'published' | 'scheduled'
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_resumes_verdict ON resumes(verdict);
CREATE INDEX IF NOT EXISTS idx_interview_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_date ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(created_at);
