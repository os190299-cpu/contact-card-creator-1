# Установка системы мониторинга администраторов

## Что добавлено:

1. **Таблица логов** в базе данных (`admin_actions`)
2. **Страница мониторинга** `/audit-log` (только для superadmin)
3. **Кнопка "Журнал действий"** в админ-панели

## Инструкция для установки на сервере:

### Шаг 1: Применить миграцию базы данных

Подключитесь к серверу через PowerShell:

```powershell
ssh root@217.156.65.145
```

Примените миграцию:

```bash
sudo -u postgres psql -d contacts_db -f /var/www/contacts-app/db_migrations/V3__add_admin_audit_log.sql
```

Проверьте что таблица создалась:

```bash
sudo -u postgres psql -d contacts_db -c "\d admin_actions"
```

### Шаг 2: Создать backend функцию для логов

Файл уже создан в `backend/audit/index.py`. Нужно настроить его на сервере.

**На сервере создайте файл:**

```bash
nano /var/www/contacts-app/backend/audit/app.py
```

Вставьте содержимое из `backend/audit/index.py` (скопируйте из проекта).

**Создайте systemd сервис:**

```bash
nano /etc/systemd/system/audit-api.service
```

Вставьте:

```ini
[Unit]
Description=Audit API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/contacts-app/backend/audit
Environment="DATABASE_URL=postgresql://contacts_user:secure_password_123@localhost/contacts_db"
ExecStart=/usr/bin/gunicorn -w 2 -b 127.0.0.1:8004 wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

**Создайте wsgi.py:**

```bash
nano /var/www/contacts-app/backend/audit/wsgi.py
```

Содержимое:

```python
from app import app as application
```

**Запустите сервис:**

```bash
systemctl enable audit-api
systemctl start audit-api
systemctl status audit-api
```

### Шаг 3: Добавить проксирование в nginx

Откройте конфиг nginx:

```bash
nano /etc/nginx/sites-available/pegusural
```

Добавьте ПЕРЕД блоком `listen 443 ssl;`:

```nginx
    location /api/audit {
        proxy_pass http://127.0.0.1:8004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
```

**Перезапустите nginx:**

```bash
nginx -t
systemctl restart nginx
```

### Шаг 4: Добавить логирование в существующие API

Теперь нужно добавить запись логов во все действия админов.

**Пример для auth API (добавить после успешного входа):**

```python
# После успешной авторизации
cur.execute("""
    INSERT INTO admin_actions (admin_username, action_type, ip_address, details)
    VALUES (%s, %s, %s, %s)
""", (username, 'login', headers.get('X-Real-IP', ''), f'Successful login'))
conn.commit()
```

**Пример для users API (при создании пользователя):**

```python
# После создания пользователя
cur.execute("""
    INSERT INTO admin_actions (admin_username, action_type, target_type, target_id, details)
    VALUES (%s, %s, %s, %s, %s)
""", (current_admin, 'create_user', 'user', new_username, f'Created user: {new_username}'))
conn.commit()
```

**Типы действий для логирования:**

- `login` - вход в систему
- `logout` - выход из системы
- `create_user` - создание пользователя
- `update_user` - изменение пользователя
- `delete_user` - удаление пользователя
- `create_contact` - добавление контакта
- `update_contact` - изменение контакта
- `delete_contact` - удаление контакта
- `change_password` - смена пароля
- `reorder_contacts` - изменение порядка контактов

### Шаг 5: Проверка работы

1. Войдите как superadmin на сайте
2. В админ-панели должна появиться кнопка "Журнал действий"
3. Перейдите на страницу журнала
4. Выполните какое-то действие (например, создайте пользователя)
5. Обновите страницу журнала - должна появиться новая запись

## Функционал мониторинга:

- **Фильтрация** по типу действия
- **Поиск** по админу, действию или деталям
- **История** всех действий с временными метками
- **IP-адреса** откуда выполнялись действия
- **Детали** каждого действия

## Доступ:

- Журнал доступен ТОЛЬКО для пользователей с ролью `superadmin`
- Обычные `admin` не видят кнопку и не могут зайти на страницу
