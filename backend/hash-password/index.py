'''
Business: Generate bcrypt hash for password (utility function)
Args: event with password in query params
Returns: bcrypt hash
'''

import json
from typing import Dict, Any
import bcrypt

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    params = event.get('queryStringParameters', {})
    password = params.get('password', '')
    
    if not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Password required'}),
            'isBase64Encoded': False
        }
    
    # Generate bcrypt hash
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'password': password,
            'hash': password_hash.decode('utf-8')
        }),
        'isBase64Encoded': False
    }
