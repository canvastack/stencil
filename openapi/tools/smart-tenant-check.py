#!/usr/bin/env python3
"""
Smart Tenant ID Checker - Follows allOf references to BaseEntity
"""

import os
import yaml
import re
from pathlib import Path
from collections import defaultdict

def check_tenant_compliance():
    """Check tenant_id compliance with smart reference following"""
    
    print('=' * 90)
    print(' ' * 25 + 'SMART TENANT ID COMPLIANCE CHECKER')
    print('=' * 90)
    print()
    
    base_path = Path(__file__).parent.parent.resolve()
    schemas_dir = base_path / 'schemas' / 'content-management'
    common_dir = base_path / 'schemas' / 'common'
    
    # Load base schemas first
    base_schemas = {}
    print('Loading base schemas...')
    for base_file in sorted(common_dir.glob('*.yaml')):
        try:
            with open(base_file, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
                if isinstance(content, dict):
                    base_schemas.update(content)
                    print(f'  Loaded: {base_file.stem} ({len(content)} schemas)')
        except Exception as e:
            print(f'  ERROR: {base_file.stem} - {str(e)}')
    
    # Check if BaseEntity has tenant_id
    base_entity = base_schemas.get('BaseEntity', {})
    base_has_tenant = False
    if isinstance(base_entity, dict):
        props = base_entity.get('properties', {})
        if 'tenant_id' in props:
            base_has_tenant = True
            print(f'\nBaseEntity HAS tenant_id: YES')
        else:
            print(f'\nBaseEntity HAS tenant_id: NO')
    
    print()
    print('CHECKING MODULES FOR TENANT_ID COMPLIANCE...')
    print('-' * 90)
    
    compliant_modules = []
    non_compliant_modules = []
    
    for schema_file in sorted(schemas_dir.glob('*.yaml')):
        module_name = schema_file.stem
        try:
            with open(schema_file, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
            
            if not isinstance(content, dict):
                continue
                
            has_tenant_compliance = False
            entities_checked = 0
            
            for entity_name, entity_def in content.items():
                if not isinstance(entity_def, dict):
                    continue
                    
                entities_checked += 1
                
                # Check direct properties
                props = entity_def.get('properties', {})
                if 'tenant_id' in props:
                    has_tenant_compliance = True
                    break
                
                # Check allOf references
                all_of = entity_def.get('allOf', [])
                if isinstance(all_of, list):
                    for ref_item in all_of:
                        if isinstance(ref_item, dict) and '$ref' in ref_item:
                            ref_path = ref_item['$ref']
                            
                            # Check if it references BaseEntity
                            if 'base.yaml#/BaseEntity' in ref_path and base_has_tenant:
                                has_tenant_compliance = True
                                break
                            
                            # Check if it references AuditableEntity (which extends BaseEntity)
                            if 'base.yaml#/AuditableEntity' in ref_path and base_has_tenant:
                                has_tenant_compliance = True
                                break
                                
                            # Check other common entities that might have tenant_id
                            if any(x in ref_path.lower() for x in ['baseentity', 'auditable', 'publishable']):
                                if base_has_tenant:
                                    has_tenant_compliance = True
                                    break
                
                if has_tenant_compliance:
                    break
            
            if has_tenant_compliance:
                compliant_modules.append(module_name)
                print(f'OK   {module_name:20} - tenant_id compliant ({entities_checked} entities)')
            else:
                non_compliant_modules.append(module_name)
                print(f'WARN {module_name:20} - NO tenant_id found ({entities_checked} entities)')
                
        except Exception as e:
            print(f'ERR  {module_name:20} - Error: {str(e)[:50]}')
    
    print()
    print('=' * 90)
    print('SUMMARY')
    print('=' * 90)
    
    total_modules = len(compliant_modules) + len(non_compliant_modules)
    
    print(f'Total modules checked: {total_modules}')
    print(f'Compliant modules: {len(compliant_modules)}')
    print(f'Non-compliant modules: {len(non_compliant_modules)}')
    
    if non_compliant_modules:
        print(f'\nNON-COMPLIANT MODULES:')
        for module in non_compliant_modules:
            print(f'  - {module}')
    
    if compliant_modules:
        print(f'\nCOMPLIANT MODULES:')
        for module in compliant_modules:
            print(f'  - {module}')
    
    print()
    if len(non_compliant_modules) == 0:
        print('RESULT: ALL MODULES ARE TENANT_ID COMPLIANT!')
    else:
        print(f'RESULT: {len(non_compliant_modules)} modules need tenant_id fixes')
    
    print('=' * 90)
    
    return non_compliant_modules, compliant_modules

if __name__ == '__main__':
    check_tenant_compliance()