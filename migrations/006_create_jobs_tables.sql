-- Create job management tables

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company VARCHAR(255),
    location VARCHAR(255),
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship')),
    experience_required INTEGER,
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    skills_required TEXT[],
    benefits TEXT[],
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
    posted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    application_deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'hired', 'rejected')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, candidate_id) -- Prevent duplicate applications
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    duration INTEGER DEFAULT 60,
    interview_type VARCHAR(50),
    location VARCHAR(255),
    interviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_by ON job_postings(posted_by);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON job_postings(job_type);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_date ON interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- Add comments
COMMENT ON TABLE job_postings IS 'Job postings created by admin for recruitment';
COMMENT ON TABLE job_applications IS 'Applications submitted by candidates for job postings';
COMMENT ON TABLE interviews IS 'Interview schedules for job applications';

COMMENT ON COLUMN job_postings.job_type IS 'Type of employment: full_time, part_time, contract, internship';
COMMENT ON COLUMN job_postings.status IS 'Job posting status: draft, published, closed, cancelled';
COMMENT ON COLUMN job_applications.status IS 'Application status: applied, screening, interview, hired, rejected';
COMMENT ON COLUMN interviews.status IS 'Interview status: scheduled, completed, cancelled, rescheduled';
