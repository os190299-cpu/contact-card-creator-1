'''
Business: Authentication API for user login with PostgreSQL database
Args: event with httpMethod, body; context with request_id
Returns: HTTP response with auth token and user role
'''

import json
import os
import hashlib
import secrets
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Create database connection using simple query protocol"""
    database_url = os.environ.get('DATABASE_URL', 'postgresql://contacts_user:SecurePass123!@localhost/contacts_db')
    return psycopg2.connect(database_url)

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        query_params = event.get('queryStringParameters', {})
        action = query_params.get('action', 'login') if query_params else 'login'
        
        # Handle password change
        if action == 'change-password':
            auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            old_password = body_data.get('old_password', '')
            new_password = body_data.get('new_password', '')
            
            if not old_password or not new_password:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Old and new password required'}),
                    'isBase64Encoded': False
                }
            
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get user by token from sessions table
            cur.execute(
                'SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()',
                (auth_token,)
            )
            session = cur.fetchone()
            
            if not session:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid or expired token'}),
                    'isBase64Encoded': False
                }
            
            user_id = session['user_id']
            
            # Verify old password
            old_password_hash = hash_password(old_password)
            cur.execute(
                'SELECT id FROM users WHERE id = %s AND password_hash = %s',
                (user_id, old_password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid old password'}),
                    'isBase64Encoded': False
                }
            
            # Update password
            new_password_hash = hash_password(new_password)
            cur.execute('UPDATE users SET password_hash = %s WHERE id = %s', (new_password_hash, user_id))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        # Handle login
        username = body_data.get('username', '')
        password = body_data.get('password', '')
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Username and password required'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        password_hash = hash_password(password)
        cur.execute(
            'SELECT id, username, role FROM users WHERE username = %s AND password_hash = %s',
            (username, password_hash)
        )
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid credentials'}),
                'isBase64Encoded': False
            }
        
        # Generate auth token and save to sessions
        auth_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=30)
        
        cur.execute(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)',
            (user['id'], auth_token, expires_at)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'token': auth_token,
                'role': user['role'],
                'username': user['username']
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }