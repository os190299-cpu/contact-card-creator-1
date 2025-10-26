-- Обновление структуры контактов для аватарок
ALTER TABLE telegram_contacts 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);

-- Обновление пароля админа с правильным bcrypt хешем для пароля admin123
UPDATE users 
SET password_hash = '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn98UlLc1xJdCJdPVf.yEGNFhmPe'
WHERE username = 'admin';