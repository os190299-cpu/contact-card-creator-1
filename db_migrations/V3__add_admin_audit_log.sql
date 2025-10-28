-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_username VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_admin_actions_username ON admin_actions(admin_username);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);

-- Add comment
COMMENT ON TABLE admin_actions IS 'Audit log for all admin actions';
