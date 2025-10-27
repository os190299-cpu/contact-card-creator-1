'''
Business: API for managing shared contacts list with PostgreSQL database
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with contacts data or status messages
'''

import json
import os
from typing import Dict, Any, List, Optional
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            # Get all contacts
            cur.execute('SELECT * FROM contacts ORDER BY display_order ASC')
            contacts = cur.fetchall()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps([dict(row) for row in contacts]),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            # Add new contact (auth required)
            body_data = json.loads(event.get('body', '{}'))
            auth_token = event.get('headers', {}).get('X-Auth-Token')
            
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Authentication required'}),
                    'isBase64Encoded': False
                }
            
            title = body_data.get('title', 'Новый контакт')
            description = body_data.get('description', 'Описание')
            telegram_link = body_data.get('telegram_link', 'https://t.me/username')
            display_order = body_data.get('display_order', 999)
            
            cur.execute(
                "INSERT INTO contacts (title, description, telegram_link, display_order) VALUES (%s, %s, %s, %s) RETURNING id",
                (title, description, telegram_link, display_order)
            )
            new_id = cur.fetchone()['id']
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'id': new_id, 'message': 'Contact created'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            # Update contact (auth required)
            body_data = json.loads(event.get('body', '{}'))
            auth_token = event.get('headers', {}).get('X-Auth-Token')
            
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Authentication required'}),
                    'isBase64Encoded': False
                }
            
            contact_id = body_data.get('id')
            if not contact_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Contact ID required'}),
                    'isBase64Encoded': False
                }
            
            title = body_data.get('title')
            description = body_data.get('description')
            telegram_link = body_data.get('telegram_link')
            display_order = body_data.get('display_order')
            
            cur.execute(
                "UPDATE contacts SET title = %s, description = %s, telegram_link = %s, display_order = %s WHERE id = %s",
                (title, description, telegram_link, display_order, contact_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Contact updated'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            # Delete contact (auth required)
            params = event.get('queryStringParameters', {})
            auth_token = event.get('headers', {}).get('X-Auth-Token')
            
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Authentication required'}),
                    'isBase64Encoded': False
                }
            
            contact_id = params.get('id')
            if not contact_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Contact ID required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("DELETE FROM contacts WHERE id = %s", (contact_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Contact deleted'}),
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
