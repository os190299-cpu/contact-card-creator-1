-- Update admin password to bcrypt hash for 'admin123'
UPDATE users 
SET password_hash = '$2b$12$Beop9AuOBXiIxfJqq73vBexI/dI7HHVshmPjDQq9jOPLVf.jZOLPC'
WHERE username = 'admin';