CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'MessageCircle',
    color VARCHAR(50) DEFAULT '#3b82f6',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO contacts (title, username, description, icon, color, sort_order) VALUES
('Основной контакт', 'yourusername', 'Свяжитесь со мной для деловых вопросов', 'Briefcase', '#3b82f6', 0),
('Личные вопросы', 'yourusername', 'Для личной переписки', 'MessageCircle', '#8b5cf6', 1)
ON CONFLICT DO NOTHING;
