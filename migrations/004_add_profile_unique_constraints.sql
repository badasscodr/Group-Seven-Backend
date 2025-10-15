-- =====================================================
-- GROUP SEVEN INITIATIVES - ADD PROFILE UNIQUE CONSTRAINTS
-- =====================================================
-- Database: Neon PostgreSQL
-- Purpose: Add unique constraints to profile tables for UPSERT operations
-- Created: 2025-10-16
-- =====================================================

-- Add unique constraints to profile tables for ON CONFLICT operations
-- These constraints are required for UPSERT (INSERT ... ON CONFLICT) to work

-- Client profiles unique constraint on user_id
ALTER TABLE client_profiles 
ADD CONSTRAINT client_profiles_user_id_unique UNIQUE (user_id);

-- Supplier profiles unique constraint on user_id  
ALTER TABLE supplier_profiles 
ADD CONSTRAINT supplier_profiles_user_id_unique UNIQUE (user_id);

-- Employee profiles unique constraint on user_id
ALTER TABLE employee_profiles 
ADD CONSTRAINT employee_profiles_user_id_unique UNIQUE (user_id);

-- Candidate profiles unique constraint on user_id
ALTER TABLE candidate_profiles 
ADD CONSTRAINT candidate_profiles_user_id_unique UNIQUE (user_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Profile unique constraints added successfully for UPSERT operations!' as status;
