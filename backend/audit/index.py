import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get audit logs for admin actions monitoring
    Args: event - dict with httpMethod, headers, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response dict with logs
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection error'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Verify token and check if superadmin
    cur.execute(
        "SELECT username, role FROM users WHERE token = %s",
        (token,)
    )
    user_row = cur.fetchone()
    
    if not user_row:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid token'}),
            'isBase64Encoded': False
        }
    
    username, role = user_row
    
    if role != 'superadmin':
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied. Superadmin only.'}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 100))
        offset = int(params.get('offset', 0))
        
        cur.execute("""
            SELECT id, admin_username, action_type, target_type, target_id, 
                   details, ip_address, created_at
            FROM admin_actions
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        
        rows = cur.fetchall()
        logs = []
        
        for row in rows:
            logs.append({
                'id': row[0],
                'admin_username': row[1],
                'action_type': row[2],
                'target_type': row[3],
                'target_id': row[4],
                'details': row[5],
                'ip_address': row[6],
                'created_at': row[7].isoformat() if row[7] else None
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'logs': logs}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
