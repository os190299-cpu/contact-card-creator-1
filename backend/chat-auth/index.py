'''
Business: Регистрация и авторизация пользователей чата
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с атрибутами: request_id, function_name
Returns: HTTP response dict с токеном и данными пользователя
'''

import json
import os
import hashlib
import hmac
import time
import psycopg2
from typing import Dict, Any, Optional

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
SCHEMA = 't_p70382350_contact_card_creator'

def create_token(user_id: int, username: str) -> str:
    payload = f"{user_id}:{username}:{int(time.time())}"
    signature = hmac.new(
        JWT_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{payload}.{signature}"

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload, signature = token.rsplit('.', 1)
        expected_signature = hmac.new(
            JWT_SECRET.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if signature != expected_signature:
            return None
        
        user_id, username, timestamp = payload.split(':')
        if int(time.time()) - int(timestamp) > 86400 * 30:
            return None
        
        return {'user_id': int(user_id), 'username': username}
    except:
        return None

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'login')
        username = body_data.get('username', '').strip()
        password = body_data.get('password', '')
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Логин и пароль обязательны'})
            }
        
        if len(username) < 3 or len(username) > 50:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Логин должен быть от 3 до 50 символов'})
            }
        
        if len(password) < 6:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'})
            }
        
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        password_hash = hash_password(password)
        
        if action == 'register':
            cur.execute(
                f'SELECT id FROM "{SCHEMA}"."chat_users" WHERE username = %s',
                (username,)
            )
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Пользователь уже существует'})
                }
            
            cur.execute(
                f'INSERT INTO "{SCHEMA}"."chat_users" (username, password_hash) VALUES (%s, %s) RETURNING id',
                (username, password_hash)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            
            token = create_token(user_id, username)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'username': username}
                })
            }
        
        else:
            cur.execute(
                f'SELECT id, password_hash, is_banned FROM "{SCHEMA}"."chat_users" WHERE username = %s',
                (username,)
            )
            result = cur.fetchone()
            
            if not result:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неверный логин или пароль'})
                }
            
            user_id, stored_hash, is_banned = result
            
            if is_banned:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Пользователь заблокирован'})
                }
            
            if stored_hash != password_hash:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неверный логин или пароль'})
                }
            
            token = create_token(user_id, username)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'username': username}
                })
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'})
        }
