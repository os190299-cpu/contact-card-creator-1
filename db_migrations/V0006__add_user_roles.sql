-- Добавляем поле role в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';

-- Обновляем существующего пользователя, делаем его супер-админом
UPDATE users SET role = 'superadmin' WHERE id = 1;

-- Добавляем поле created_at если его нет
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;