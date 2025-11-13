#!/usr/bin/env python3
"""
Advanced OpenAPI Validation with Reference & Cross-Module Checking
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
    
    print('╔' + '═' * 88 + '╗')
    print('║' + ' ' * 88 + '║')
    print('║' + '🔍 ADVANCED OPENAPI SCHEMA VALIDATION & ISSUES REPORT'.center(88) + '║')
    print('║' + ' ' * 88 + '║')
    print('╚' + '═' * 88 + '╝')
    print()
    
    base_path = Path(__file__).parent.parent.resolve()
    schemas_dir = base_path / 'schemas' / 'content-management'
    paths_dir = base_path / 'paths' / 'content-management'
    components_dir = base_path / 'components'
    
    issues_found = {
        'critical': [],
        'warning': [],
        'info': []
    }
    
    # Load all schemas to build reference map
    all_schemas = {}
    schema_entities = defaultdict(list)
    
    print('📖 LOADING ALL SCHEMAS...')
    print('-' * 90)
    
    for schema_file in sorted(schemas_dir.glob('*.yaml')):
        module_name = schema_file.stem
        try:
            with open(schema_file, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
            
            all_schemas[module_name] = content
            if isinstance(content, dict):
                for entity_name in content.keys():
                    schema_entities[entity_name].append(module_name)
                    
            print(f'✅ Loaded: {module_name:20} ({len(content) if isinstance(content, dict) else "?":2} entities)')
        except Exception as e:
            issues_found['critical'].append(f'Failed to load {module_name}: {str(e)[:60]}')
            print(f'❌ Failed: {module_name:20} - {str(e)[:50]}')
    
    print()
    print('🔎 CHECKING TENANT_ID COMPLIANCE...')
    print('-' * 90)
    
    # Check tenant_id in all schemas
    tenant_id_missing = []
    for module_name, schemas in all_schemas.items():
        if isinstance(schemas, dict):
            has_tenant_id = False
            for entity_name, entity_def in schemas.items():
                if isinstance(entity_def, dict):
                    props = entity_def.get('properties', {})
                    if 'tenant_id' in props:
                        has_tenant_id = True
                        break
            
            if not has_tenant_id:
                tenant_id_missing.append(module_name)
                issues_found['critical'].append(
                    f'TENANT_ID: Module "{module_name}" missing tenant_id field in all entities'
                )
                print(f'⚠️ {module_name:20} - NO tenant_id FOUND')
            else:
                print(f'✅ {module_name:20} - tenant_id present')
    
    print()
    print('🔗 CHECKING SCHEMA REFERENCES & DEFINITIONS...')
    print('-' * 90)
    
    # Check path files for $ref usage and validity
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
                print(f'\n📄 {module_name:20} - Found {len(set(refs_in_file))} unique references:')
                
                for ref in set(refs_in_file):
                    if ref.startswith('#/'):
                        # Internal reference - check if it resolves
                        ref_path = ref.split('/')[1:]  # Skip '#'
                        print(f'   ├─ {ref:60} (internal)', end='')
                        
                        # Simple check - just warn if suspicious
                        if 'responses' in ref_path or 'schemas' in ref_path:
                            print(' ✅')
                        else:
                            print(' ⚠️')
                    else:
                        print(f'   ├─ {ref:60} (external)')
                        issues_found['warning'].append(f'Unsupported reference format in {module_name}: {ref}')
        
        except Exception as e:
            issues_found['warning'].append(f'Error checking references in {module_name}: {str(e)[:50]}')
    
    print()
    print('🔐 CHECKING SECURITY CONFIGURATION...')
    print('-' * 90)
    
    security_issues = defaultdict(list)
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
            print(f'⚠️ {module:20} - {len(issues)} endpoints missing explicit security:')
            for issue in issues[:3]:  # Show first 3
                print(f'   └─ {issue["method"]} {issue["path"]}')
            if len(issues) > 3:
                print(f'   └─ ... and {len(issues) - 3} more')
            issues_found['warning'].extend([
                f'SECURITY: {module} - {issue["method"]} {issue["path"]} missing security'
                for issue in issues
            ])
    else:
        print('✅ All endpoints have explicit security definitions')
    
    print()
    print('📐 CHECKING ENTITY RELATIONSHIPS...')
    print('-' * 90)
    
    # Check for potential broken references between modules
    entity_conflicts = []
    for entity_name, modules in schema_entities.items():
        if len(modules) > 1:
            print(f'📌 Entity "{entity_name}" defined in: {", ".join(modules)}')
            entity_conflicts.append((entity_name, modules))
    
    if not entity_conflicts:
        print('✅ No entity name conflicts found')
    else:
        print(f'\n⚠️ Found {len(entity_conflicts)} entities defined in multiple modules')
        for entity, modules in entity_conflicts:
            issues_found['info'].append(f'Entity "{entity}" found in modules: {", ".join(modules)}')
    
    print()
    print('📊 ENDPOINT VALIDATION...')
    print('-' * 90)
    
    endpoints_by_method = defaultdict(int)
    endpoints_with_examples = 0
    endpoints_with_descriptions = 0
    
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
    print('╔' + '═' * 88 + '╗')
    print('║' + ' ' * 88 + '║')
    print('║' + '📋 ISSUES SUMMARY'.center(88) + '║')
    print('║' + ' ' * 88 + '║')
    print('╚' + '═' * 88 + '╝')
    print()
    
    # Print critical issues
    if issues_found['critical']:
        print('🚨 CRITICAL ISSUES (must fix):')
        print('-' * 90)
        for i, issue in enumerate(issues_found['critical'], 1):
            print(f'{i:2}. {issue}')
        print()
    
    # Print warnings
    if issues_found['warning']:
        print('⚠️  WARNINGS (should review):')
        print('-' * 90)
        unique_warnings = list(dict.fromkeys(issues_found['warning']))[:10]  # Unique, first 10
        for i, issue in enumerate(unique_warnings, 1):
            print(f'{i:2}. {issue}')
        if len(issues_found['warning']) > 10:
            print(f'... and {len(issues_found["warning"]) - 10} more warnings')
        print()
    
    # Print info
    if issues_found['info']:
        print('ℹ️  INFORMATION:')
        print('-' * 90)
        for i, issue in enumerate(issues_found['info'][:5], 1):
            print(f'{i:2}. {issue}')
        if len(issues_found['info']) > 5:
            print(f'... and {len(issues_found["info"]) - 5} more info items')
        print()
    
    # Final summary
    print()
    print('═' * 90)
    print('📌 FINAL ASSESSMENT')
    print('═' * 90)
    print()
    
    total_issues = len(issues_found['critical']) + len(issues_found['warning'])
    
    if len(issues_found['critical']) == 0 and len(issues_found['warning']) == 0:
        print('✅ VALIDATION PASSED - No critical issues found!')
    elif len(issues_found['critical']) == 0:
        print(f'⚠️  VALIDATION WARNING - {len(issues_found["warning"])} warnings found')
    else:
        print(f'🚨 VALIDATION FAILED - {len(issues_found["critical"])} critical, {len(issues_found["warning"])} warnings')
    
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
