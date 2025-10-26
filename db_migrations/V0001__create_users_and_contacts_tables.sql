-- Создание таблицы пользователей (админов)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы Telegram контактов
CREATE TABLE IF NOT EXISTS telegram_contacts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    telegram_link VARCHAR(500) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрой сортировки
CREATE INDEX IF NOT EXISTS idx_contacts_order ON telegram_contacts(display_order);

-- Вставка дефолтного админа (пароль: admin123)
INSERT INTO users (username, password_hash) 
VALUES ('admin', '$2b$10$rJ7qZKZ.vF3pX8zQGZ8zPuK9qYxJZ3nHZqJ0Z9X0Z1Z2Z3Z4Z5Z6Z') 
ON CONFLICT (username) DO NOTHING;

-- Вставка примеров контактов
INSERT INTO telegram_contacts (title, description, telegram_link, display_order) VALUES
('Основной контакт', 'Связь для общих вопросов', 'https://t.me/example_main', 1),
('Поддержка', 'Техническая поддержка 24/7', 'https://t.me/example_support', 2),
('Канал новостей', 'Подписывайтесь на обновления', 'https://t.me/example_news', 3)
ON CONFLICT DO NOTHING;