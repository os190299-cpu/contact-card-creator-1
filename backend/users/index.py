'''
Business: User management API - create, list, delete users with secure password hashing
Args: event with httpMethod, body; context with request_id
Returns: HTTP response with user data or operation status
'''

import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Create database connection"""
    database_url = os.environ.get('DATABASE_URL', 'postgresql://contacts_user:SecurePass123!@localhost/contacts_db')
    return psycopg2.connect(database_url)

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_auth(event: Dict[str, Any], conn) -> bool:
    """Verify auth token from sessions table"""
    headers = event.get('headers', {})
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not auth_token:
        return False
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()', (auth_token,))
    result = cur.fetchone()
    cur.close()
    return result is not None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    
    try:
        conn = get_db_connection()
        
        if not verify_auth(event, conn):
            conn.close()
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT id, username, role FROM users ORDER BY id')
            users = cur.fetchall()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps([dict(u) for u in users]),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            username = body_data.get('username', '').strip()
            password = body_data.get('password', '')
            role = body_data.get('role', 'admin')
            
            if not username or not password:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Username and password required'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute('SELECT id FROM users WHERE username = %s', (username,))
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 409,
                    'headers': headers,
                    'body': json.dumps({'error': 'User already exists'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            cur.execute(
                'INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s) RETURNING id',
                (username, password_hash, role)
            )
            user_id = cur.fetchone()['id']
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'id': user_id, 'username': username, 'role': role}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {}) or {}
            username = query_params.get('username', '')
            
            if not username:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Username required'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute('SELECT role FROM users WHERE username = %s', (username,))
            user = cur.fetchone()
            
            if user and user['role'] == 'superadmin':
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Cannot delete superadmin'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('DELETE FROM users WHERE username = %s', (username,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            conn.close()
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        try:
            conn.close()
        except:
            pass
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }