import json
import os
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

def verify_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    '''Verify JWT token and return decoded data'''
    if not token:
        return None
    secret_key = os.environ.get('JWT_SECRET', 'default-secret-key-change-me')
    try:
        decoded = jwt.decode(token, secret_key, algorithms=['HS256'])
        return decoded
    except:
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Unified API for contacts management and authentication
    Args: event with httpMethod, path, body, headers
    Returns: JSON response
    '''
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {})
    action = params.get('action', 'get-contacts')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    if action == 'login' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        username = body_data.get('username', '').strip()
        password = body_data.get('password', '')
        
        if not username or not password:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username and password required'})
            }
        
        cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        secret_key = os.environ.get('JWT_SECRET', 'default-secret-key-change-me')
        token = jwt.encode({
            'user_id': user[0],
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, secret_key, algorithm='HS256')
        
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'token': token, 'username': username})
        }
    
    if action == 'get-contacts' and method == 'GET':
        cur.execute("SELECT id, title, description, telegram_link, display_order FROM telegram_contacts ORDER BY display_order ASC")
        contacts = cur.fetchall()
        
        result = [
            {
                'id': c[0],
                'title': c[1],
                'description': c[2],
                'telegram_link': c[3],
                'display_order': c[4]
            }
            for c in contacts
        ]
        
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'contacts': result})
        }
    
    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    user_data = verify_token(token)
    
    if not user_data and action not in ['get-contacts', 'login']:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    if action == 'add-contact' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        title = body_data.get('title', '').strip()
        description = body_data.get('description', '').strip()
        telegram_link = body_data.get('telegram_link', '').strip()
        display_order = body_data.get('display_order', 0)
        
        if not title or not telegram_link:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Title and telegram_link required'})
            }
        
        cur.execute(
            "INSERT INTO telegram_contacts (title, description, telegram_link, display_order) VALUES (%s, %s, %s, %s) RETURNING id",
            (title, description, telegram_link, display_order)
        )
        contact_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'id': contact_id, 'message': 'Contact created'})
        }
    
    if action == 'update-contact' and method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        contact_id = body_data.get('id')
        
        if not contact_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Contact ID required'})
            }
        
        update_fields = []
        params = []
        
        for field in ['title', 'description', 'telegram_link', 'display_order']:
            if field in body_data:
                update_fields.append(f'{field} = %s')
                params.append(body_data[field])
        
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        params.append(contact_id)
        
        query = f"UPDATE telegram_contacts SET {', '.join(update_fields)} WHERE id = %s"
        cur.execute(query, params)
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'message': 'Contact updated'})
        }
    
    if action == 'delete-contact' and method == 'DELETE':
        params = event.get('queryStringParameters', {})
        contact_id = params.get('id')
        
        if not contact_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Contact ID required'})
            }
        
        cur.execute("DELETE FROM telegram_contacts WHERE id = %s", (contact_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'message': 'Contact deleted'})
        }
    
    if action == 'change-password' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        old_password = body_data.get('old_password', '')
        new_password = body_data.get('new_password', '')
        
        if not old_password or not new_password:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Old and new password required'})
            }
        
        if len(new_password) < 6:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'New password must be at least 6 characters'})
            }
        
        user_id = user_data['user_id']
        cur.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if not user or not bcrypt.checkpw(old_password.encode('utf-8'), user[0].encode('utf-8')):
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid old password'})
            }
        
        new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user_id))
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'message': 'Password changed successfully'})
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Not found'})
    }