// Job Management Types

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience_required?: number;
  salary_min?: number;
  salary_max?: number;
  skills_required?: string[];
  benefits?: string[];
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  posted_by: string;
  application_deadline?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateJobData {
  title: string;
  description: string;
  company?: string;
  location?: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience_required?: number;
  salary_min?: number;
  salary_max?: number;
  skills_required?: string[];
  benefits?: string[];
  status?: 'draft' | 'published' | 'closed' | 'cancelled';
  application_deadline?: string;
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  jobType?: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience_required?: number;
  salary_min?: number;
  salary_max?: number;
  skills_required?: string[];
  benefits?: string[];
  status?: 'draft' | 'published' | 'closed' | 'cancelled';
  application_deadline?: string;
}

export interface JobFilters {
  status?: 'draft' | 'published' | 'closed' | 'cancelled';
  jobType?: 'full_time' | 'part_time' | 'contract' | 'internship';
  location?: string;
  experience_min?: number;
  experience_max?: number;
  page?: number;
  limit?: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: 'applied' | 'screening' | 'interview' | 'hired' | 'rejected';
  applied_at: Date;
  updatedAt?: Date;
}

export interface CreateApplicationData {
  coverLetter?: string;
  resumeUrl?: string;
}

export interface UpdateApplicationData {
  status: 'applied' | 'screening' | 'interview' | 'hired' | 'rejected';
  notes?: string;
}

export interface Interview {
  id: string;
  application_id: string;
  scheduledDate: Date;
  duration?: number;
  interviewType?: string;
  location?: string;
  interviewerId?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: Date;
}

export interface CreateInterviewData {
  scheduledDate: string;
  duration?: number;
  interviewType?: string;
  location?: string;
  interviewerId?: string;
  notes?: string;
}

export interface ApplicationFilters {
  status?: 'applied' | 'screening' | 'interview' | 'hired' | 'rejected';
  jobId?: string;
  candidateId?: string;
  page?: number;
  limit?: number;
}
