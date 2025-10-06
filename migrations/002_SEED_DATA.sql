-- =====================================================
-- SEED DATA - INITIAL DATA POPULATION
-- =====================================================
-- Created: 2025-10-05
-- Purpose: Populate service categories and initial data
-- =====================================================

BEGIN;

-- =====================================================
-- SERVICE CATEGORIES
-- =====================================================

INSERT INTO service_categories ("name", "description", "icon", "isActive") VALUES
('Construction', 'Building and construction services', 'Building', true),
('Maintenance', 'Maintenance and repair services', 'Wrench', true),
('Consulting', 'Professional consulting services', 'Briefcase', true),
('Technology', 'IT and technology services', 'Cpu', true),
('Legal', 'Legal and compliance services', 'Scale', true),
('HR Services', 'Human resources and recruitment', 'Users', true),
('Transportation', 'Logistics and transportation', 'Truck', true),
('Visa Services', 'Visa and immigration assistance', 'FileText', true),
('Manpower Supply', 'Temporary and permanent staffing', 'UserPlus', true),
('Financial Services', 'Accounting and financial advisory', 'DollarSign', true)
ON CONFLICT DO NOTHING;

COMMIT;

SELECT 'Seed data inserted successfully.' AS status;
