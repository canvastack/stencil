#!/usr/bin/env python3
"""
Check what schemas are defined in main OpenAPI file
"""

import yaml
from pathlib import Path

def check_schemas():
    # Load main OpenAPI file
    main_path = Path(__file__).parent.parent / 'openapi.yaml'
    with open(main_path, 'r', encoding='utf-8') as f:
        main_content = yaml.safe_load(f)

    # Check components section
    components = main_content.get('components', {})
    schemas = components.get('schemas', {})
    responses = components.get('responses', {})
    parameters = components.get('parameters', {})

    print('DEFINED COMPONENTS IN MAIN FILE:')
    print('=' * 50)
    
    print(f'\nSCHEMAS ({len(schemas)}):')
    for name in sorted(schemas.keys()):
        print(f'  - {name}')

    print(f'\nRESPONSES ({len(responses)}):')
    for name in sorted(responses.keys()):
        print(f'  - {name}')
        
    print(f'\nPARAMETERS ({len(parameters)}):')
    for name in sorted(parameters.keys()):
        print(f'  - {name}')

    return schemas, responses, parameters

if __name__ == '__main__':
    check_schemas()