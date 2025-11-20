#!/usr/bin/env python3
import yaml
import re
import os
import glob

base_path = r'd:\worksites\canvastack\projects\stencil\openapi'

def extract_missing_schemas():
    """Extract all referenced but missing schemas"""
    
    # Load existing schemas
    with open(os.path.join(base_path, 'components/schemas.yaml'), 'r', encoding='utf-8') as f:
        existing = yaml.safe_load(f) or {}
    
    existing_names = set(existing.keys())
    missing_schemas = set()
    
    # Find all schema references in path files
    path_files = glob.glob(os.path.join(base_path, 'paths/**/*.yaml'), recursive=True)
    
    for file_path in path_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find $ref patterns that reference schemas
        pattern = r"\$ref:\s*['\"][^'\"]*schemas\.yaml#/([^'\"]+)['\"]"
        matches = re.findall(pattern, content)
        
        for schema_name in matches:
            if schema_name not in existing_names:
                missing_schemas.add(schema_name)
    
    # Also check openapi.yaml
    with open(os.path.join(base_path, 'openapi.yaml'), 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = r"\$ref:\s*['\"][^'\"]*schemas\.yaml#/([^'\"]+)['\"]"
    matches = re.findall(pattern, content)
    
    for schema_name in matches:
        if schema_name not in existing_names:
            missing_schemas.add(schema_name)
    
    return sorted(missing_schemas)

def generate_stub_schema(name):
    """Generate a stub schema for a missing component"""
    return {
        'type': 'object',
        'description': f'Schema for {name}',
        'properties': {
            'id': {
                'type': 'string',
                'format': 'uuid'
            },
            'tenant_id': {
                'type': 'string',
                'format': 'uuid'
            }
        },
        'required': ['id', 'tenant_id']
    }

def main():
    print("Extracting missing schemas...")
    missing = extract_missing_schemas()
    
    print(f"Found {len(missing)} missing schemas:")
    for i, name in enumerate(missing):
        if i < 10:
            print(f"  {i+1}. {name}")
    if len(missing) > 10:
        print(f"  ... and {len(missing) - 10} more")
    
    # Load current schemas
    schema_file = os.path.join(base_path, 'components/schemas.yaml')
    with open(schema_file, 'r', encoding='utf-8') as f:
        current = yaml.safe_load(f) or {}
    
    # Add stubs for missing schemas
    added = 0
    for name in missing:
        if name not in current:
            current[name] = generate_stub_schema(name)
            added += 1
    
    # Write back to file
    with open(schema_file, 'w', encoding='utf-8') as f:
        yaml.dump(current, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
    
    print(f"\nAdded {added} stub schemas to components/schemas.yaml")
    print("Note: These are stubs - you should update them with proper definitions")

if __name__ == '__main__':
    main()
