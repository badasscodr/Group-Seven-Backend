-- Job Assignments for Employees Migration
-- This creates tables for assigning jobs/projects to employees

-- Create enum for assignment status
DO $$ BEGIN
    CREATE TYPE assignment_status_enum AS ENUM ('assigned', 'in_progress', 'completed', 'on_hold', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for assignment priority
DO $$ BEGIN
    CREATE TYPE assignment_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create projects table (what employees work on)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES users(id),
    project_manager_id UUID REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    status assignment_status_enum DEFAULT 'assigned',
    priority assignment_priority_enum DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employee job assignments table
CREATE TABLE IF NOT EXISTS employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES users(id) NOT NULL,
    project_id UUID REFERENCES projects(id) NOT NULL,
    role_in_project VARCHAR(100), -- e.g., Developer, Designer, Manager
    assigned_by UUID REFERENCES users(id), -- Admin who assigned
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE,
    end_date DATE,
    hours_allocated INTEGER, -- expected hours per week
    status assignment_status_enum DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create task assignments for granular work tracking
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES employee_assignments(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status assignment_status_enum DEFAULT 'assigned',
    priority assignment_priority_enum DEFAULT 'medium',
    estimated_hours INTEGER,
    actual_hours INTEGER,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee_id ON employee_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_project_id ON employee_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignment_id ON task_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add some sample data for testing
INSERT INTO projects (title, description, start_date, end_date, status, priority) VALUES
('Website Development', 'Build responsive website for client', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'assigned', 'high'),
('Mobile App Project', 'Develop cross-platform mobile application', CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'assigned', 'medium'),
('Database Migration', 'Migrate legacy database to new system', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '21 days', 'assigned', 'high')
ON CONFLICT DO NOTHING;