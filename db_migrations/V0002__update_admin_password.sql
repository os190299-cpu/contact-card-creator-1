-- Обновление пароля админа (пароль: admin123)
-- Хеш сгенерирован с помощью bcrypt
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LEJwtxQxGqVKDxLqW'
WHERE username = 'admin';