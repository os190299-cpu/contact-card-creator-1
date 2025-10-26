-- Добавляем таблицу для отслеживания попыток входа (rate limiting и логирование)
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    username VARCHAR(255),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по IP и времени
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_address, attempted_at DESC);

-- Индекс для быстрого поиска по username
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);