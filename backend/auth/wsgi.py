from index import handler
import json

def application(environ, start_response):
    method = environ.get('REQUEST_METHOD', 'GET')
    
    # Parse query string
    query_params = {}
    if environ.get('QUERY_STRING'):
        for param in environ['QUERY_STRING'].split('&'):
            if '=' in param:
                key, value = param.split('=', 1)
                query_params[key] = value
    
    # Build event object
    event = {
        'httpMethod': method,
        'headers': {k[5:].replace('_', '-').lower(): v for k, v in environ.items() if k.startswith('HTTP_')},
        'body': environ['wsgi.input'].read().decode('utf-8') if method in ['POST', 'PUT'] else '',
        'queryStringParameters': query_params
    }
    
    # Context object
    class Context:
        request_id = environ.get('HTTP_X_REQUEST_ID', '000')
        function_name = 'auth-api'
        function_version = '1.0'
        memory_limit_in_mb = 256
    
    # Call handler
    response = handler(event, Context())
    
    # Build WSGI response
    status = f"{response.get('statusCode', 200)} OK"
    headers = [(k, v) for k, v in response.get('headers', {}).items()]
    
    start_response(status, headers)
    body = response.get('body', '')
    return [body.encode('utf-8') if isinstance(body, str) else body]
