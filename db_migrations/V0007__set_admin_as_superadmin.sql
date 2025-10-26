-- Обновляем роль пользователя admin на superadmin
UPDATE users SET role = 'superadmin' WHERE username = 'admin';