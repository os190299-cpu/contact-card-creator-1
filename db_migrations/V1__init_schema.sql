-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    telegram_link VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create page_settings table
CREATE TABLE IF NOT EXISTS page_settings (
    id SERIAL PRIMARY KEY,
    main_title VARCHAR(255) NOT NULL DEFAULT 'Мои контакты',
    main_description TEXT DEFAULT 'Свяжитесь со мной в Telegram',
    background_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- Insert default page settings
INSERT INTO page_settings (main_title, main_description)
VALUES ('Мои контакты', 'Свяжитесь со мной в Telegram')
ON CONFLICT DO NOTHING;

-- Insert default contact
INSERT INTO contacts (title, description, telegram_link, display_order)
VALUES ('Telegram', 'Свяжитесь со мной', 'https://t.me/username', 1)
ON CONFLICT DO NOTHING;
