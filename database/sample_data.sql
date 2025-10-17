-- PortalOps Sample Data
-- This script inserts sample data for testing and development

-- Insert sample users
-- Password for all login users is 'password' (hashed with bcrypt)
INSERT INTO users (id, name, email, password_hash, department) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'John Admin', 'admin@portalops.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJBzwxey2', 'IT'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 'service.admin@portalops.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJBzwxey2', 'IT Operations'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Michael Chen', 'product.admin@portalops.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJBzwxey2', 'Engineering'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Emily Davis', 'emily.davis@portalops.com', NULL, 'Engineering'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Jane Smith', 'jane.smith@portalops.com', NULL, 'Marketing'),
    ('550e8400-e29b-41d4-a716-446655440006', 'David Wilson', 'david.wilson@portalops.com', NULL, 'Marketing');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 1), -- John is Admin
    ('550e8400-e29b-41d4-a716-446655440002', 2), -- Alice is ServiceAdministrator
    ('550e8400-e29b-41d4-a716-446655440003', 3); -- Bob is ProductAdministrator

-- Insert sample services
INSERT INTO services (id, name, vendor, url) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'Google Workspace', 'Google', 'https://workspace.google.com'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Microsoft 365', 'Microsoft', 'https://office.com'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Slack', 'Slack Technologies', 'https://slack.com'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Zoom', 'Zoom Video Communications', 'https://zoom.us');

-- Insert sample products
INSERT INTO products (id, service_id, name, description) VALUES 
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Gmail', 'Email service'),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Google Drive', 'Cloud storage service'),
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Google Calendar', 'Calendar and scheduling service'),
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Outlook', 'Email and calendar service'),
    ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'OneDrive', 'Cloud storage service'),
    ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', 'Teams', 'Communication and collaboration platform'),
    ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440003', 'Slack Workspace', 'Team communication platform'),
    ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440004', 'Zoom Meetings', 'Video conferencing service');

-- Insert sample payment information
INSERT INTO payment_info (product_id, status, amount, cardholder_name, expiry_date, payment_method) VALUES 
    ('770e8400-e29b-41d4-a716-446655440001', 'complete', 6.00, 'Company Finance Dept', '12/2025', 'Visa'),
    ('770e8400-e29b-41d4-a716-446655440002', 'complete', 6.00, 'Company Finance Dept', '12/2025', 'Visa'),
    ('770e8400-e29b-41d4-a716-446655440003', 'complete', 6.00, 'Company Finance Dept', '12/2025', 'Visa'),
    ('770e8400-e29b-41d4-a716-446655440004', 'complete', 12.50, 'Company Finance Dept', '12/2025', 'Mastercard'),
    ('770e8400-e29b-41d4-a716-446655440005', 'complete', 5.00, 'Company Finance Dept', '12/2025', 'Mastercard'),
    ('770e8400-e29b-41d4-a716-446655440006', 'complete', 12.50, 'Company Finance Dept', '12/2025', 'Mastercard'),
    ('770e8400-e29b-41d4-a716-446655440007', 'incomplete', 6.25, NULL, NULL, NULL),
    ('770e8400-e29b-41d4-a716-446655440008', 'complete', 14.99, 'Company Finance Dept', '12/2025', 'Visa');

-- Insert sample permission assignments
-- Alice manages Google Workspace service
INSERT INTO permission_assignments (user_id, service_id, product_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', NULL);

-- Bob manages specific products
INSERT INTO permission_assignments (user_id, service_id, product_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440003', NULL, '770e8400-e29b-41d4-a716-446655440004'),
    ('550e8400-e29b-41d4-a716-446655440003', NULL, '770e8400-e29b-41d4-a716-446655440005'),
    ('550e8400-e29b-41d4-a716-446655440003', NULL, '770e8400-e29b-41d4-a716-446655440007');

-- Insert sample workflow tasks
INSERT INTO workflow_tasks (type, status, assignee_user_id, target_user_id, details, due_date) VALUES 
    ('onboarding', 'pending', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Setup Google Workspace account for Carol', now() + interval '3 days'),
    ('onboarding', 'pending', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Setup Microsoft 365 account for David', now() + interval '2 days'),
    ('offboarding', 'completed', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Remove access for former employee', now() - interval '1 day');

-- Insert sample audit logs
INSERT INTO audit_logs (actor_user_id, action, target_id, details) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'user.role.assign', '550e8400-e29b-41d4-a716-446655440002', '{"role": "ServiceAdministrator", "assigned_at": "2024-01-15T10:30:00Z"}'),
    ('550e8400-e29b-41d4-a716-446655440001', 'service.create', '660e8400-e29b-41d4-a716-446655440001', '{"service_name": "Google Workspace", "vendor": "Google"}'),
    ('550e8400-e29b-41d4-a716-446655440002', 'permission.assign', '550e8400-e29b-41d4-a716-446655440002', '{"service_id": "660e8400-e29b-41d4-a716-446655440001", "permission_type": "service_admin"}'),
    ('550e8400-e29b-41d4-a716-446655440001', 'workflow.task.complete', '550e8400-e29b-41d4-a716-446655440004', '{"task_type": "offboarding", "completed_at": "2024-01-16T14:20:00Z"}');
