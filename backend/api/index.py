import json
import os
import psycopg2
import bcrypt
import jwt
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

def verify_token(token: Optional[str], conn=None) -> Optional[Dict[str, Any]]:
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
    Business: API for Telegram contacts management
    Args: event with httpMethod, path, body, headers
    Returns: JSON response
    '''
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    path_params = event.get('pathParams', {}) or {}
    resource_id = path_params.get('id', '')
    
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
    
    headers = event.get('headers', {})
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if action == 'login' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        username = body_data.get('username', '').strip()
        password = body_data.get('password', '')
        
        ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
        
        if not username or not password:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username and password required'})
            }
        
        cur.execute(
            "SELECT COUNT(*) FROM login_attempts WHERE ip_address = %s AND attempted_at > NOW() - INTERVAL '15 minutes' AND success = FALSE",
            (ip_address,)
        )
        failed_attempts = cur.fetchone()[0]
        
        if failed_attempts >= 5:
            cur.close()
            conn.close()
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Too many failed attempts. Try again in 15 minutes'})
            }
        
        cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        
        time.sleep(0.5)
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
            cur.execute(
                "INSERT INTO login_attempts (ip_address, username, success) VALUES (%s, %s, FALSE)",
                (ip_address, username)
            )
            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        cur.execute(
            "INSERT INTO login_attempts (ip_address, username, success) VALUES (%s, %s, TRUE)",
            (ip_address, username)
        )
        conn.commit()
        
        secret_key = os.environ.get('JWT_SECRET', 'default-secret-key-change-me')
        token = jwt.encode(
            {'user_id': user[0], 'exp': datetime.utcnow() + timedelta(days=7)},
            secret_key,
            algorithm='HS256'
        )
        
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'token': token})
        }
    
    if action == 'get-contacts' and method == 'GET':
        cur.execute("SELECT id, title, username, description, icon, color, sort_order FROM contacts ORDER BY sort_order")
        contacts = cur.fetchall()
        result = [{
            'id': c[0],
            'title': c[1],
            'username': c[2],
            'description': c[3],
            'icon': c[4],
            'color': c[5],
            'sort_order': c[6]
        } for c in contacts]
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'contacts': result})
        }
    
    user_data = verify_token(auth_token, conn)
    if not user_data:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    if action == 'add-contact' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        cur.execute(
            "INSERT INTO contacts (title, username, description, icon, color, sort_order) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (body_data['title'], body_data['username'], body_data['description'], body_data['icon'], body_data['color'], body_data['sort_order'])
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': new_id})
        }
    
    if action == 'update-contact' and method == 'PUT':
        contact_id = int(params.get('id', 0))
        body_data = json.loads(event.get('body', '{}'))
        cur.execute(
            "UPDATE contacts SET title = %s, username = %s, description = %s, icon = %s, color = %s WHERE id = %s",
            (body_data['title'], body_data['username'], body_data['description'], body_data['icon'], body_data['color'], contact_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    if action == 'delete-contact' and method == 'DELETE':
        contact_id = int(params.get('id', 0))
        cur.execute("DELETE FROM contacts WHERE id = %s", (contact_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    if action == 'reorder-contacts' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        for contact in body_data['contacts']:
            cur.execute("UPDATE contacts SET sort_order = %s WHERE id = %s", (contact['sort_order'], contact['id']))
        conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    if action == 'change-password' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        old_password = body_data.get('old_password', '')
        new_password = body_data.get('new_password', '')
        
        cur.execute("SELECT password_hash FROM users WHERE id = %s", (user_data['user_id'],))
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
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user_data['user_id']))
        conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    cur.close()
    conn.close()
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Not found'})
    }