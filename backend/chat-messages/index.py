'''
Business: Отправка и получение сообщений чата
Args: event - dict с httpMethod, body, headers
      context - object с атрибутами: request_id, function_name
Returns: HTTP response dict со списком сообщений или статусом отправки
'''

import json
import os
import hashlib
import hmac
import psycopg2
from typing import Dict, Any, Optional, List

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
SCHEMA = 't_p70382350_contact_card_creator'

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
        return {'user_id': int(user_id), 'username': username}
    except:
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute(f'''
                SELECT 
                    m.id, 
                    m.user_id, 
                    m.message, 
                    m.created_at,
                    m.is_removed,
                    u.username
                FROM "{SCHEMA}"."chat_messages" m
                JOIN "{SCHEMA}"."chat_users" u ON m.user_id = u.id
                WHERE m.is_removed = false
                ORDER BY m.created_at ASC
                LIMIT 100
            ''')
            
            rows = cur.fetchall()
            messages = []
            for row in rows:
                messages.append({
                    'id': row[0],
                    'user_id': row[1],
                    'message': row[2],
                    'created_at': row[3].isoformat() if row[3] else None,
                    'is_removed': row[4],
                    'username': row[5]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'messages': messages})
            }
        
        elif method == 'POST':
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            
            if not token:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            user_data = verify_token(token)
            if not user_data:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неверный токен'})
                }
            
            cur.execute(
                f'SELECT is_banned FROM "{SCHEMA}"."chat_users" WHERE id = %s',
                (user_data['user_id'],)
            )
            result = cur.fetchone()
            if not result or result[0]:
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
            
            body_data = json.loads(event.get('body', '{}'))
            message = body_data.get('message', '').strip()
            
            if not message:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Сообщение не может быть пустым'})
                }
            
            if len(message) > 1000:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Сообщение слишком длинное (макс. 1000 символов)'})
                }
            
            cur.execute(
                f'INSERT INTO "{SCHEMA}"."chat_messages" (user_id, message) VALUES (%s, %s) RETURNING id',
                (user_data['user_id'], message)
            )
            message_id = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message_id': message_id})
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        cur.close()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'})
        }
