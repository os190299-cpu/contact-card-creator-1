CREATE TABLE IF NOT EXISTS page_settings (
    id INT PRIMARY KEY DEFAULT 1,
    main_title VARCHAR(255) NOT NULL DEFAULT 'Мои контакты',
    main_description TEXT NOT NULL DEFAULT 'Свяжитесь со мной в Telegram',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row_constraint CHECK (id = 1)
);

INSERT INTO page_settings (id, main_title, main_description) 
VALUES (1, 'Мои контакты', 'Свяжитесь со мной в Telegram')
ON CONFLICT (id) DO NOTHING;