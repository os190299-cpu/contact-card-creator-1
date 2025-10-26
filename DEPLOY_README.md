# Инструкция по развёртыванию на VPS

## Сервер: 217.156.65.145
## Логин: root
## Пароль: d373IcT6KGuwaU27pz

---

## Шаг 1: Подключитесь к серверу

```bash
ssh root@217.156.65.145
```

Пароль: `d373IcT6KGuwaU27pz`

---

## Шаг 2: Загрузите файлы проекта

Распакуйте архив `contacts-app.tar.gz` в папку `/root/contacts-app`:

```bash
cd /root
tar -xzf contacts-app.tar.gz
cd contacts-app
```

---

## Шаг 3: Запустите скрипт развёртывания

```bash
chmod +x deploy.sh
./deploy.sh
```

Скрипт автоматически:
- Установит зависимости
- Создаст таблицы в базе данных
- Настроит Nginx
- Запустит backend API
- Развернёт frontend

---

## Шаг 4: Проверьте работу

Откройте в браузере: **http://217.156.65.145**

Логин для админки: `admin`
Пароль: `admin123`

---

## Полезные команды

### Проверить статус backend:
```bash
sudo systemctl status contacts-api
sudo systemctl status auth-api
sudo systemctl status settings-api
```

### Перезапустить backend:
```bash
sudo systemctl restart contacts-api auth-api settings-api
```

### Посмотреть логи:
```bash
sudo journalctl -u contacts-api -f
sudo journalctl -u auth-api -f
sudo journalctl -u settings-api -f
```

### Проверить Nginx:
```bash
sudo systemctl status nginx
sudo nginx -t
```

---

## Что изменилось

✅ Теперь все видят одни и те же контакты (данные в PostgreSQL)
✅ Нет лимитов на размер данных
✅ Все изменения сохраняются на сервере
✅ Доступ с любого устройства
