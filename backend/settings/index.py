'''
Business: API for managing page settings (title, description, background) with PostgreSQL
Args: event with httpMethod, body; context with request_id
Returns: HTTP response with page settings data
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Create database connection using simple query protocol"""
    database_url = os.environ.get('DATABASE_URL', 'postgresql://contacts_user:SecurePass123!@localhost/contacts_db')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            # Get page settings
            cur.execute('SELECT * FROM page_settings LIMIT 1')
            settings = cur.fetchone()
            cur.close()
            conn.close()
            
            if not settings:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'id': 1,
                        'main_title': 'Мои контакты',
                        'main_description': 'Свяжитесь со мной в Telegram',
                        'background_image_url': None
                    }),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(dict(settings)),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            # Update page settings (auth required)
            body_data = json.loads(event.get('body', '{}'))
            auth_token = event.get('headers', {}).get('X-Auth-Token')
            
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Authentication required'}),
                    'isBase64Encoded': False
                }
            
            main_title = body_data.get('main_title', 'Мои контакты')
            main_description = body_data.get('main_description', 'Свяжитесь со мной в Telegram')
            background_image_url = body_data.get('background_image_url')
            
            cur.execute('SELECT id FROM page_settings LIMIT 1')
            existing = cur.fetchone()
            
            if existing:
                cur.execute(
                    'UPDATE page_settings SET main_title = %s, main_description = %s, background_image_url = %s WHERE id = %s',
                    (main_title, main_description, background_image_url, existing['id'])
                )
            else:
                cur.execute(
                    'INSERT INTO page_settings (main_title, main_description, background_image_url) VALUES (%s, %s, %s)',
                    (main_title, main_description, background_image_url)
                )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Settings updated'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
