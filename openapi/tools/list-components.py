#!/usr/bin/env python3
"""
List all available components
"""

import yaml
from pathlib import Path

def list_components():
    base_path = Path(__file__).parent.parent
    
    # Check responses
    responses_path = base_path / 'components' / 'responses.yaml'
    with open(responses_path, 'r', encoding='utf-8') as f:
        responses = yaml.safe_load(f)

    print('AVAILABLE RESPONSES:')
    print('=' * 30)
    for name in sorted(responses.keys()):
        print(f'  - {name}')
    print(f'Total: {len(responses)}')

    # Check parameters
    parameters_path = base_path / 'components' / 'parameters.yaml'
    with open(parameters_path, 'r', encoding='utf-8') as f:
        parameters = yaml.safe_load(f)

    print('\nAVAILABLE PARAMETERS:')
    print('=' * 30)
    for name in sorted(parameters.keys()):
        print(f'  - {name}')
    print(f'Total: {len(parameters)}')

    # Check schemas
    schemas_path = base_path / 'components' / 'schemas.yaml'
    with open(schemas_path, 'r', encoding='utf-8') as f:
        schemas = yaml.safe_load(f)

    print('\nAVAILABLE COMPONENT SCHEMAS:')
    print('=' * 30)
    for name in sorted(schemas.keys()):
        print(f'  - {name}')
    print(f'Total: {len(schemas)}')

if __name__ == '__main__':
    list_components()