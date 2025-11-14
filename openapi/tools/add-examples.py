#!/usr/bin/env python3
"""
Add examples to OpenAPI endpoints for better documentation
"""

import yaml
import json
from pathlib import Path

def add_examples():
    print('=' * 90)
    print(' ' * 30 + 'ADDING EXAMPLES TO ENDPOINTS')
    print('=' * 90)
    print()
    
    base_path = Path(__file__).parent.parent
    paths_dir = base_path / 'paths' / 'content-management'
    
    # Common example data
    examples_data = {
        'tenant_id': '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'uuid': '550e8400-e29b-41d4-a716-446655440000',
        'timestamp': '2025-11-13T18:58:00Z',
        'pagination': {
            'current_page': 1,
            'per_page': 15,
            'total': 127,
            'last_page': 9
        }
    }
    
    files_processed = 0
    examples_added = 0
    
    print('PROCESSING PATH FILES FOR EXAMPLES...')
    print('-' * 90)
    
    for path_file in sorted(paths_dir.glob('*.yaml')):
        module_name = path_file.stem
        
        try:
            with open(path_file, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
            
            if not isinstance(content, dict):
                continue
                
            original_content = json.dumps(content, sort_keys=True)
            examples_in_file = 0
            
            # Process each path
            for path, path_item in content.items():
                if not isinstance(path_item, dict):
                    continue
                    
                # Process each HTTP method
                for method in ['get', 'post', 'put', 'patch', 'delete']:
                    if method not in path_item:
                        continue
                        
                    operation = path_item[method]
                    if not isinstance(operation, dict):
                        continue
                        
                    # Add examples to responses
                    responses = operation.get('responses', {})
                    for status_code, response in responses.items():
                        if not isinstance(response, dict):
                            continue
                            
                        # Skip $ref responses (they might have examples in components)
                        if '$ref' in response:
                            continue
                            
                        content_section = response.get('content', {})
                        for media_type, media_content in content_section.items():
                            if not isinstance(media_content, dict):
                                continue
                                
                            # Add example if not exists
                            if 'examples' not in media_content and 'example' not in media_content:
                                # Create appropriate example based on status code
                                example_data = create_example_for_status(status_code, module_name, method, examples_data)
                                if example_data:
                                    media_content['example'] = example_data
                                    examples_in_file += 1
                    
                    # Add examples to request body
                    if 'requestBody' in operation:
                        req_body = operation['requestBody']
                        if isinstance(req_body, dict) and '$ref' not in req_body:
                            content_section = req_body.get('content', {})
                            for media_type, media_content in content_section.items():
                                if isinstance(media_content, dict):
                                    if 'examples' not in media_content and 'example' not in media_content:
                                        example_data = create_request_example(module_name, method, examples_data)
                                        if example_data:
                                            media_content['example'] = example_data
                                            examples_in_file += 1
            
            # Write back if changes were made
            new_content = json.dumps(content, sort_keys=True)
            if new_content != original_content:
                with open(path_file, 'w', encoding='utf-8') as f:
                    yaml.dump(content, f, default_flow_style=False, sort_keys=False, indent=2)
                
                files_processed += 1
                examples_added += examples_in_file
                print(f'UPDATED {module_name:20} - {examples_in_file:3} examples added')
            else:
                print(f'SKIP    {module_name:20} - no examples needed')
                
        except Exception as e:
            print(f'ERROR   {module_name:20} - {str(e)[:50]}')
    
    print()
    print('=' * 90)
    print('SUMMARY')
    print('=' * 90)
    print(f'Files processed: {files_processed}')
    print(f'Examples added: {examples_added}')
    
    if examples_added > 0:
        print('\nEXAMPLES ADDITION COMPLETED!')
        print('All endpoints now have better documentation with examples.')
    else:
        print('\nNO EXAMPLES ADDED')
        print('All endpoints already have sufficient examples.')
    
    print('=' * 90)

def create_example_for_status(status_code, module_name, method, examples_data):
    """Create appropriate example based on HTTP status code"""
    
    if status_code == '200':
        if method == 'get':
            return {
                'success': True,
                'data': {
                    'id': examples_data['uuid'],
                    'tenant_id': examples_data['tenant_id'],
                    'title': f'Sample {module_name.title()} Title',
                    'created_at': examples_data['timestamp'],
                    'updated_at': examples_data['timestamp']
                },
                'message': f'{module_name.title()} retrieved successfully',
                'meta': {
                    'timestamp': examples_data['timestamp'],
                    'tenant_id': examples_data['tenant_id']
                }
            }
        else:
            return {
                'success': True,
                'data': {
                    'id': examples_data['uuid'],
                    'tenant_id': examples_data['tenant_id']
                },
                'message': f'{module_name.title()} {method}ed successfully',
                'meta': {
                    'timestamp': examples_data['timestamp']
                }
            }
    
    elif status_code == '201':
        return {
            'success': True,
            'data': {
                'id': examples_data['uuid'],
                'tenant_id': examples_data['tenant_id'],
                'created_at': examples_data['timestamp']
            },
            'message': f'{module_name.title()} created successfully',
            'meta': {
                'timestamp': examples_data['timestamp']
            }
        }
    
    return None

def create_request_example(module_name, method, examples_data):
    """Create request body example"""
    
    if method == 'post':
        return {
            'title': f'New {module_name.title()} Title',
            'description': f'Sample description for {module_name}',
            'is_active': True
        }
    elif method in ['put', 'patch']:
        return {
            'title': f'Updated {module_name.title()} Title',
            'description': f'Updated description for {module_name}',
            'is_active': True
        }
    
    return None

if __name__ == '__main__':
    add_examples()