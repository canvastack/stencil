#!/usr/bin/env python3
"""
Fix main OpenAPI file to properly import all components
"""

import yaml
from pathlib import Path

def fix_main_components():
    print('=' * 90)
    print(' ' * 25 + 'FIXING MAIN OPENAPI COMPONENTS IMPORT')
    print('=' * 90)
    print()
    
    base_path = Path(__file__).parent.parent
    main_path = base_path / 'openapi.yaml'
    
    # Load component files
    responses_path = base_path / 'components' / 'responses.yaml'
    with open(responses_path, 'r', encoding='utf-8') as f:
        responses = yaml.safe_load(f)

    parameters_path = base_path / 'components' / 'parameters.yaml'
    with open(parameters_path, 'r', encoding='utf-8') as f:
        parameters = yaml.safe_load(f)

    schemas_path = base_path / 'components' / 'schemas.yaml'
    with open(schemas_path, 'r', encoding='utf-8') as f:
        component_schemas = yaml.safe_load(f)

    print(f'Loaded {len(responses)} responses')
    print(f'Loaded {len(parameters)} parameters')
    print(f'Loaded {len(component_schemas)} component schemas')
    print()
    
    # Load main OpenAPI file
    with open(main_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the components section and fix it
    lines = content.split('\n')
    new_lines = []
    in_components = False
    in_responses = False
    in_parameters = False
    in_schemas = False
    indent_level = 0
    
    for line in lines:
        if line.strip() == 'components:':
            in_components = True
            new_lines.append(line)
            indent_level = len(line) - len(line.lstrip())
            continue
        
        if in_components and line.strip().startswith('responses:'):
            in_responses = True
            new_lines.append('  responses:')
            # Add all responses
            for name in sorted(responses.keys()):
                new_lines.append(f'    {name}:')
                new_lines.append(f'      $ref: \'./components/responses.yaml#/{name}\'')
            continue
        
        if in_components and line.strip().startswith('parameters:'):
            in_parameters = True
            new_lines.append('  parameters:')
            # Add all parameters
            for name in sorted(parameters.keys()):
                new_lines.append(f'    {name}:')
                new_lines.append(f'      $ref: \'./components/parameters.yaml#/{name}\'')
            continue
            
        if in_components and line.strip().startswith('schemas:'):
            in_schemas = True
            new_lines.append('  schemas:')
            new_lines.append('    # External component schemas')
            # Add all component schemas
            for name in sorted(component_schemas.keys()):
                new_lines.append(f'    {name}:')
                new_lines.append(f'      $ref: \'./components/schemas.yaml#/{name}\'')
            new_lines.append('')
            new_lines.append('    # Content Management Schemas')
            # Add placeholders for content schemas that will be added later
            schema_modules = ['about', 'contact', 'customers', 'documentation', 'faq', 
                            'financial', 'homepage', 'inventory', 'language', 'media', 
                            'orders', 'plugins', 'products', 'reviews', 'seo', 
                            'settings', 'suppliers', 'theme', 'users', 'vendors']
            
            for module in schema_modules:
                new_lines.append(f'    # {module.title()} schemas will be added here')
                
            continue
        
        # Skip old $ref lines in components section
        if in_components and ('$ref:' in line and any(x in line for x in ['./components/', '../schemas/'])):
            continue
            
        # Detect end of components section
        if in_components and line.strip() and not line.startswith(' '):
            in_components = False
            in_responses = False  
            in_parameters = False
            in_schemas = False
            
        new_lines.append(line)
    
    # Write back the fixed content
    with open(main_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print('MAIN OPENAPI FILE UPDATED!')
    print(f'- Added {len(responses)} response definitions')
    print(f'- Added {len(parameters)} parameter definitions') 
    print(f'- Added {len(component_schemas)} component schema definitions')
    print()
    print('=' * 90)

if __name__ == '__main__':
    fix_main_components()