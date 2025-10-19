-- PortalOps Database Schema
-- PostgreSQL Database Creation Script
-- Based on Database_Design.md
-- Updated for PRD v2.0 (2025-10-17)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean recreation)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS workflow_tasks CASCADE;
DROP TABLE IF EXISTS permission_assignments CASCADE;
DROP TABLE IF EXISTS payment_info CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    department VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Create user_roles join table
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Create services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create products table
-- PRD v2.0 Changes:
-- - service_id is nullable (products can be unassociated)
-- - ON DELETE SET NULL for service deletion
-- - name must be unique
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID,
    name VARCHAR(255) NOT NULL UNIQUE,
    url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- Create payment_info table
-- PRD v2.0 Changes:
-- - Added bill_attachment_path for file uploads
CREATE TABLE payment_info (
    product_id UUID PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'incomplete',
    amount DECIMAL(10, 2),
    cardholder_name VARCHAR(255),
    expiry_date DATE,
    payment_method VARCHAR(50),
    bill_attachment_path TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CHECK (status IN ('incomplete', 'complete'))
);

-- Create permission_assignments table
CREATE TABLE permission_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    service_id UUID,
    product_id UUID,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CHECK (service_id IS NOT NULL OR product_id IS NOT NULL)
);

-- Create workflow_tasks table
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    assignee_user_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    details TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (type IN ('onboarding', 'offboarding')),
    CHECK (status IN ('pending', 'completed', 'invited', 'in_progress', 'cancelled'))
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
-- Foreign key indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_products_service_id ON products(service_id);
CREATE INDEX idx_permission_assignments_user_id ON permission_assignments(user_id);
CREATE INDEX idx_permission_assignments_service_id ON permission_assignments(service_id);
CREATE INDEX idx_permission_assignments_product_id ON permission_assignments(product_id);
CREATE INDEX idx_workflow_tasks_assignee_user_id ON workflow_tasks(assignee_user_id);
CREATE INDEX idx_workflow_tasks_target_user_id ON workflow_tasks(target_user_id);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);

-- Multi-column indexes for permission checks
CREATE INDEX idx_permission_assignments_user_service ON permission_assignments(user_id, service_id);
CREATE INDEX idx_permission_assignments_user_product ON permission_assignments(user_id, product_id);

-- Additional performance indexes
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX idx_workflow_tasks_assignee_status ON workflow_tasks(assignee_user_id, status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department);

-- Insert initial roles data
-- PRD v2.0 Changes:
-- - Removed ProductAdministrator role (only Admin and ServiceAdministrator remain)
INSERT INTO roles (name) VALUES 
    ('Admin'),
    ('ServiceAdministrator');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_info_updated_at BEFORE UPDATE ON payment_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
-- View for users with their roles
CREATE VIEW user_roles_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.department,
    r.name as role_name,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id;

-- View for products with service information
-- PRD v2.0 Changes:
-- - Changed to LEFT JOIN to include unassociated products (service_id can be NULL)
CREATE VIEW products_with_services AS
SELECT 
    p.id,
    p.name as product_name,
    p.description,
    s.name as service_name,
    s.vendor,
    s.url as service_url,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN services s ON p.service_id = s.id;

-- View for permission assignments with details
CREATE VIEW permission_details AS
SELECT 
    pa.id,
    u.name as user_name,
    u.email as user_email,
    s.name as service_name,
    p.name as product_name,
    CASE 
        WHEN pa.service_id IS NOT NULL THEN 'Service'
        WHEN pa.product_id IS NOT NULL THEN 'Product'
    END as permission_type
FROM permission_assignments pa
JOIN users u ON pa.user_id = u.id
LEFT JOIN services s ON pa.service_id = s.id
LEFT JOIN products p ON pa.product_id = p.id;

COMMENT ON TABLE users IS 'Stores information about all individuals in the system';
COMMENT ON TABLE roles IS 'Static table defining system roles';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles';
COMMENT ON TABLE services IS 'Company web services';
COMMENT ON TABLE products IS 'Products/modules associated with services';
COMMENT ON TABLE payment_info IS 'Billing information for each product';
COMMENT ON TABLE permission_assignments IS 'Core RBAC table linking users to resources';
COMMENT ON TABLE workflow_tasks IS 'Tasks for the inbox system';
COMMENT ON TABLE audit_logs IS 'Records significant events for auditing';
