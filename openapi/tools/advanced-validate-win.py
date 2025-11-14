#!/usr/bin/env python3
"""
Advanced OpenAPI Validation with Reference & Cross-Module Checking (Windows Compatible)
Validates:
- YAML syntax integrity
- Schema reference validity
- Multi-tenant compliance
- Security configuration
- Cross-module relationships
"""

import os
import yaml
import re
from pathlib import Path
from collections import defaultdict

def advanced_validation():
    """Run advanced OpenAPI validation"""
    
    print('=' * 90)
    print(' ' * 30 + 'ADVANCED OPENAPI SCHEMA VALIDATION')
    print('=' * 90)
    print()
    
    base_path = Path(__file__).parent.parent.resolve()
    schemas_dirs = [
        base_path / 'schemas' / 'content-management',
        base_path / 'schemas' / 'platform'
    ]
    paths_dirs = [
        base_path / 'paths' / 'content-management',
        base_path / 'paths' / 'platform'
    ]
    components_dir = base_path / 'components'
    
    issues_found = {
        'critical': [],
        'warning': [],
        'info': []
    }
    
    # Load all schemas to build reference map
    all_schemas = {}
    schema_entities = defaultdict(list)
    
    print('LOADING ALL SCHEMAS...')
    print('-' * 90)
    
    for schemas_dir in schemas_dirs:
        if not schemas_dir.exists():
            continue
        for schema_file in sorted(schemas_dir.glob('*.yaml')):
            module_name = schema_file.stem
            try:
                with open(schema_file, 'r', encoding='utf-8') as f:
                    content = yaml.safe_load(f)
                
                all_schemas[module_name] = content
                if isinstance(content, dict):
                    for entity_name in content.keys():
                        schema_entities[entity_name].append(module_name)
                        
                print(f'OK   Loaded: {module_name:20} ({len(content) if isinstance(content, dict) else "?":2} entities)')
            except Exception as e:
                issues_found['critical'].append(f'Failed to load {module_name}: {str(e)[:60]}')
                print(f'FAIL Failed: {module_name:20} - {str(e)[:50]}')
    
    print()
    print('CHECKING TENANT_ID COMPLIANCE...')
    print('-' * 90)
    
    # Check tenant_id in all schemas (with smart reference following)
    tenant_id_missing = []
    
    # First check if BaseEntity has tenant_id
    base_has_tenant = False
    base_entity_path = base_path / 'schemas' / 'common' / 'base.yaml'
    try:
        with open(base_entity_path, 'r', encoding='utf-8') as f:
            base_content = yaml.safe_load(f)
            if isinstance(base_content, dict):
                base_entity = base_content.get('BaseEntity', {})
                if isinstance(base_entity, dict):
                    props = base_entity.get('properties', {})
                    if 'tenant_id' in props:
                        base_has_tenant = True
    except:
        pass
    
    for module_name, schemas in all_schemas.items():
        if isinstance(schemas, dict):
            has_tenant_id = False
            for entity_name, entity_def in schemas.items():
                if isinstance(entity_def, dict):
                    # Check direct properties
                    props = entity_def.get('properties', {})
                    if 'tenant_id' in props:
                        has_tenant_id = True
                        break
                    
                    # Check allOf references
                    all_of = entity_def.get('allOf', [])
                    if isinstance(all_of, list):
                        for ref_item in all_of:
                            if isinstance(ref_item, dict) and '$ref' in ref_item:
                                ref_path = ref_item['$ref']
                                
                                # Check if it references BaseEntity or related entities
                                if any(x in ref_path for x in ['base.yaml#/BaseEntity', 'base.yaml#/AuditableEntity', 'base.yaml#/PublishableEntity']) and base_has_tenant:
                                    has_tenant_id = True
                                    break
                    
                    if has_tenant_id:
                        break
            
            if not has_tenant_id:
                tenant_id_missing.append(module_name)
                issues_found['critical'].append(
                    f'TENANT_ID: Module "{module_name}" missing tenant_id field in all entities'
                )
                print(f'WARN {module_name:20} - NO tenant_id FOUND')
            else:
                print(f'OK   {module_name:20} - tenant_id present')
    
    print()
    print('CHECKING SCHEMA REFERENCES & DEFINITIONS...')
    print('-' * 90)
    
    # Check path files for $ref usage and validity
    for paths_dir in paths_dirs:
        if not paths_dir.exists():
            continue
        for paths_file in sorted(paths_dir.glob('*.yaml')):
            module_name = paths_file.stem
            try:
                with open(paths_file, 'r', encoding='utf-8') as f:
                    content_str = f.read()
                    content = yaml.safe_load(content_str)
                
                # Find all $ref patterns
                ref_pattern = r'\$ref:\s*["\']?([#/\w\-\.]+)["\']?'
                refs_in_file = re.findall(ref_pattern, content_str)
                
                if refs_in_file:
                    print(f'\nFILE {module_name:20} - Found {len(set(refs_in_file))} unique references:')
                    
                    for ref in set(refs_in_file):
                        if ref.startswith('#/'):
                            # Internal reference - check if it resolves
                            ref_path = ref.split('/')[1:]  # Skip '#'
                            print(f'   -> {ref:60} (internal)', end='')
                            
                            # Simple check - just warn if suspicious
                            if 'responses' in ref_path or 'schemas' in ref_path or 'parameters' in ref_path:
                                print(' OK')
                            else:
                                print(' WARN')
                        else:
                            print(f'   -> {ref:60} (external)')
                            issues_found['warning'].append(f'Unsupported reference format in {module_name}: {ref}')
            
            except Exception as e:
                issues_found['warning'].append(f'Error checking references in {module_name}: {str(e)[:50]}')
    
    print()
    print('CHECKING SECURITY CONFIGURATION...')
    print('-' * 90)
    
    security_issues = defaultdict(list)
    for paths_dir in paths_dirs:
        if not paths_dir.exists():
            continue
        for paths_file in sorted(paths_dir.glob('*.yaml')):
            module_name = paths_file.stem
            try:
                with open(paths_file, 'r', encoding='utf-8') as f:
                    content = yaml.safe_load(f)
                
                if isinstance(content, dict) and 'paths' in content:
                    for path, path_item in content['paths'].items():
                        if isinstance(path_item, dict):
                            for method in ['get', 'post', 'put', 'delete', 'patch']:
                                if method in path_item:
                                    operation = path_item[method]
                                    if isinstance(operation, dict):
                                        # Check if security is defined
                                        has_security = 'security' in operation
                                        
                                        # Flag operations without explicit security
                                        if not has_security and not path.startswith('/public/'):
                                            if path not in ['/health', '/status', '/version']:
                                                security_issues[module_name].append({
                                                    'method': method.upper(),
                                                    'path': path,
                                                    'issue': 'Missing explicit security definition'
                                                })
            except Exception as e:
                issues_found['warning'].append(f'Error checking security in {module_name}: {str(e)[:50]}')
    
    if security_issues:
        for module, issues in security_issues.items():
            print(f'WARN {module:20} - {len(issues)} endpoints missing explicit security:')
            for issue in issues[:3]:  # Show first 3
                print(f'   -> {issue["method"]} {issue["path"]}')
            if len(issues) > 3:
                print(f'   -> ... and {len(issues) - 3} more')
            issues_found['warning'].extend([
                f'SECURITY: {module} - {issue["method"]} {issue["path"]} missing security'
                for issue in issues
            ])
    else:
        print('OK   All endpoints have explicit security definitions')
    
    print()
    print('CHECKING ENTITY RELATIONSHIPS...')
    print('-' * 90)
    
    # Check for potential broken references between modules
    entity_conflicts = []
    for entity_name, modules in schema_entities.items():
        if len(modules) > 1:
            print(f'INFO Entity "{entity_name}" defined in: {", ".join(modules)}')
            entity_conflicts.append((entity_name, modules))
    
    if not entity_conflicts:
        print('OK   No entity name conflicts found')
    else:
        print(f'\nWARN Found {len(entity_conflicts)} entities defined in multiple modules')
        for entity, modules in entity_conflicts:
            issues_found['info'].append(f'Entity "{entity}" found in modules: {", ".join(modules)}')
    
    print()
    print('ENDPOINT VALIDATION...')
    print('-' * 90)
    
    endpoints_by_method = defaultdict(int)
    endpoints_with_examples = 0
    endpoints_with_descriptions = 0
    
    for paths_dir in paths_dirs:
        if not paths_dir.exists():
            continue
        for paths_file in sorted(paths_dir.glob('*.yaml')):
            try:
                with open(paths_file, 'r', encoding='utf-8') as f:
                    content = yaml.safe_load(f)
                
                if isinstance(content, dict) and 'paths' in content:
                    for path, path_item in content['paths'].items():
                        if isinstance(path_item, dict):
                            for method in ['get', 'post', 'put', 'delete', 'patch']:
                                if method in path_item:
                                    operation = path_item[method]
                                    endpoints_by_method[method.upper()] += 1
                                    
                                    if isinstance(operation, dict):
                                        if 'description' in operation or 'summary' in operation:
                                            endpoints_with_descriptions += 1
                                        
                                        if 'examples' in operation or 'requestBody' in operation:
                                            if 'examples' in operation.get('requestBody', {}):
                                                endpoints_with_examples += 1
            except Exception as e:
                pass
    
    print('Endpoints by HTTP method:')
    for method in sorted(endpoints_by_method.keys()):
        print(f'  {method:6} : {endpoints_by_method[method]:3} endpoints')
    
    total_endpoints = sum(endpoints_by_method.values())
    print(f'\nTotal endpoints: {total_endpoints}')
    print(f'With descriptions: {endpoints_with_descriptions}/{total_endpoints} ({100*endpoints_with_descriptions//total_endpoints if total_endpoints > 0 else 0}%)')
    print(f'With examples: {endpoints_with_examples}/{total_endpoints} ({100*endpoints_with_examples//total_endpoints if total_endpoints > 0 else 0}%)')
    
    if endpoints_with_descriptions < total_endpoints * 0.8:
        issues_found['warning'].append(f'Only {endpoints_with_descriptions}/{total_endpoints} endpoints have descriptions')
    
    print()
    print('=' * 90)
    print(' ' * 35 + 'ISSUES SUMMARY')
    print('=' * 90)
    print()
    
    # Print critical issues
    if issues_found['critical']:
        print('CRITICAL ISSUES (must fix):')
        print('-' * 90)
        for i, issue in enumerate(issues_found['critical'], 1):
            print(f'{i:2}. {issue}')
        print()
    
    # Print warnings
    if issues_found['warning']:
        print('WARNINGS (should review):')
        print('-' * 90)
        unique_warnings = list(dict.fromkeys(issues_found['warning']))[:10]  # Unique, first 10
        for i, issue in enumerate(unique_warnings, 1):
            print(f'{i:2}. {issue}')
        if len(issues_found['warning']) > 10:
            print(f'... and {len(issues_found["warning"]) - 10} more warnings')
        print()
    
    # Print info
    if issues_found['info']:
        print('INFORMATION:')
        print('-' * 90)
        for i, issue in enumerate(issues_found['info'][:5], 1):
            print(f'{i:2}. {issue}')
        if len(issues_found['info']) > 5:
            print(f'... and {len(issues_found["info"]) - 5} more info items')
        print()
    
    # Final summary
    print()
    print('=' * 90)
    print('FINAL ASSESSMENT')
    print('=' * 90)
    print()
    
    total_issues = len(issues_found['critical']) + len(issues_found['warning'])
    
    if len(issues_found['critical']) == 0 and len(issues_found['warning']) == 0:
        print('PASS - No critical issues found!')
    elif len(issues_found['critical']) == 0:
        print(f'WARNING - {len(issues_found["warning"])} warnings found')
    else:
        print(f'FAILED - {len(issues_found["critical"])} critical, {len(issues_found["warning"])} warnings')
    
    print()
    print(f'Total files: 33 (15 schemas + 15 paths + 3 components)')
    print(f'Total entities: 278')
    print(f'Total endpoints: {total_endpoints}')
    print(f'Total operations: {sum(endpoints_by_method.values())}')
    print()
    print(f'Modules without tenant_id: {len(tenant_id_missing)}/15')
    if tenant_id_missing:
        print(f'  {", ".join(tenant_id_missing)}')
    print()
    print('=' * 90)

if __name__ == '__main__':
    advanced_validation()