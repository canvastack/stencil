#!/usr/bin/env python3
"""
Comprehensive OpenAPI Schema Validation Script
Validates all schema and path files for completeness and compliance
"""

import os
import yaml
import json
from pathlib import Path
from collections import defaultdict

def validate_all_schemas():
    """Validate all OpenAPI schema files"""
    
    print('=' * 90)
    print('🚀 COMPREHENSIVE OPENAPI VALIDATION REPORT')
    print('=' * 90)
    print()
    
    base_path = Path(__file__).parent.parent.resolve()
    schemas_dir = base_path / 'schemas' / 'content-management'
    paths_dir = base_path / 'paths' / 'content-management'
    components_dir = base_path / 'components'
    
    # Track results
    results = {
        'total_files': 0,
        'valid_files': 0,
        'invalid_files': 0,
        'modules': {},
        'issues': [],
        'tenant_id_issues': [],
        'security_issues': []
    }
    
    # Validation functions
    def check_tenant_id(content, module_name):
        """Check if tenant_id is present in schema"""
        if not isinstance(content, dict):
            return False
        
        for entity_name, entity_def in content.items():
            if isinstance(entity_def, dict) and 'properties' in entity_def:
                if 'tenant_id' in entity_def['properties']:
                    return True
        return False
    
    def check_security(content, module_name):
        """Check if security is properly configured"""
        if not isinstance(content, dict):
            return []
        
        issues = []
        
        # Check paths for security definitions
        if 'paths' in content:
            for path, path_item in content['paths'].items():
                if isinstance(path_item, dict):
                    for method in ['get', 'post', 'put', 'delete', 'patch']:
                        if method in path_item:
                            operation = path_item[method]
                            if isinstance(operation, dict):
                                # Public paths should have public operations
                                if not path.startswith('/public/') and 'security' not in operation:
                                    if path not in ['/health', '/status', '/version']:
                                        issues.append(f'Missing security on {method.upper()} {path}')
        
        return issues
    
    # Validate schema files
    print('📊 SCHEMA FILES VALIDATION')
    print('-' * 90)
    
    schema_files = sorted(schemas_dir.glob('*.yaml'))
    for schema_file in schema_files:
        module_name = schema_file.stem.upper()
        results['total_files'] += 1
        
        try:
            with open(schema_file, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
            
            file_size = schema_file.stat().st_size / 1024
            
            # Count entities
            num_entities = 0
            if isinstance(content, dict):
                num_entities = len(content)
            
            results['valid_files'] += 1
            results['modules'][module_name] = {
                'schema_valid': True,
                'schema_size_kb': round(file_size, 1),
                'schema_entities': num_entities,
                'paths_valid': None,
                'paths_size_kb': None,
                'paths_endpoints': None,
                'paths_operations': None,
                'has_tenant_id': False,
                'issues': []
            }
            
            # Check for tenant_id
            has_tenant_id = check_tenant_id(content, module_name)
            results['modules'][module_name]['has_tenant_id'] = has_tenant_id
            
            if not has_tenant_id:
                results['tenant_id_issues'].append(module_name)
                results['modules'][module_name]['issues'].append('⚠️ Missing tenant_id in schema')
                print(f'⚠️  {module_name:15} Schema: {num_entities:2} entities, {file_size:6.1f} KB ⚠️ NO tenant_id')
            else:
                print(f'✅ {module_name:15} Schema: {num_entities:2} entities, {file_size:6.1f} KB')
                
        except yaml.YAMLError as e:
            results['invalid_files'] += 1
            results['modules'][module_name] = {
                'schema_valid': False,
                'error': f'YAML Error: {str(e)[:60]}'
            }
            print(f'❌ {module_name:15} Schema: YAML ERROR - {str(e)[:40]}')
        except Exception as e:
            results['invalid_files'] += 1
            results['modules'][module_name] = {
                'schema_valid': False,
                'error': str(e)[:60]
            }
            print(f'❌ {module_name:15} Schema: ERROR - {str(e)[:40]}')
    
    print()
    print('📊 PATHS FILES VALIDATION')
    print('-' * 90)
    
    paths_files = sorted(paths_dir.glob('*.yaml'))
    for paths_file in paths_files:
        module_name = paths_file.stem.upper()
        results['total_files'] += 1
        
        try:
            with open(paths_file, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
            
            file_size = paths_file.stat().st_size / 1024
            
            # Count endpoints and operations
            num_endpoints = 0
            num_operations = 0
            if isinstance(content, dict) and 'paths' in content:
                paths_def = content['paths']
                if isinstance(paths_def, dict):
                    num_endpoints = len(paths_def)
                    for path_item in paths_def.values():
                        if isinstance(path_item, dict):
                            for method in ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']:
                                if method in path_item:
                                    num_operations += 1
            
            results['valid_files'] += 1
            
            if module_name in results['modules']:
                results['modules'][module_name]['paths_valid'] = True
                results['modules'][module_name]['paths_size_kb'] = round(file_size, 1)
                results['modules'][module_name]['paths_endpoints'] = num_endpoints
                results['modules'][module_name]['paths_operations'] = num_operations
            
            # Check security
            sec_issues = check_security(content, module_name)
            if sec_issues:
                results['security_issues'].extend([(module_name, issue) for issue in sec_issues])
                results['modules'][module_name]['issues'].extend(sec_issues)
            
            print(f'✅ {module_name:15} Paths: {num_endpoints:2} endpoints, {num_operations:2} ops, {file_size:6.1f} KB')
            
        except yaml.YAMLError as e:
            results['invalid_files'] += 1
            print(f'❌ {module_name:15} Paths: YAML ERROR - {str(e)[:40]}')
        except Exception as e:
            results['invalid_files'] += 1
            print(f'❌ {module_name:15} Paths: ERROR - {str(e)[:40]}')
    
    print()
    print('📊 COMPONENTS FILES VALIDATION')
    print('-' * 90)
    
    component_files = sorted(components_dir.glob('*.yaml'))
    for comp_file in component_files:
        comp_name = comp_file.stem.upper()
        results['total_files'] += 1
        
        try:
            with open(comp_file, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
            
            file_size = comp_file.stat().st_size / 1024
            results['valid_files'] += 1
            
            print(f'✅ {comp_name:15} Component: {file_size:6.1f} KB')
            
        except Exception as e:
            results['invalid_files'] += 1
            print(f'❌ {comp_name:15} Component: ERROR - {str(e)[:40]}')
    
    # Summary
    print()
    print('=' * 90)
    print('📋 VALIDATION SUMMARY')
    print('=' * 90)
    
    print(f'Total files checked:     {results["total_files"]}')
    print(f'Valid files:             {results["valid_files"]}')
    print(f'Invalid files:           {results["invalid_files"]}')
    
    # Count modules
    modules_complete = sum(1 for m in results['modules'].values() 
                          if m.get('schema_valid') and m.get('paths_valid'))
    modules_partial = sum(1 for m in results['modules'].values() 
                         if (m.get('schema_valid') or m.get('paths_valid')) 
                         and not (m.get('schema_valid') and m.get('paths_valid')))
    modules_missing = sum(1 for m in results['modules'].values() 
                         if not m.get('schema_valid') and not m.get('paths_valid'))
    
    print()
    print(f'✅ Modules complete (schema + paths): {modules_complete}')
    print(f'⚠️  Modules partial (one file only):  {modules_partial}')
    print(f'❌ Modules missing:                  {modules_missing}')
    
    # Detailed stats
    total_entities = sum(m.get('schema_entities', 0) for m in results['modules'].values() if m.get('schema_valid'))
    total_endpoints = sum(m.get('paths_endpoints', 0) for m in results['modules'].values() if m.get('paths_valid'))
    total_operations = sum(m.get('paths_operations', 0) for m in results['modules'].values() if m.get('paths_valid'))
    
    print()
    print('📊 SCHEMA STATISTICS:')
    print(f'   Total schema entities: {total_entities}')
    print(f'   Total API endpoints:   {total_endpoints}')
    print(f'   Total API operations:  {total_operations}')
    
    # Issues
    print()
    print('🔍 COMPLIANCE CHECKS:')
    print('-' * 90)
    
    if results['tenant_id_issues']:
        print(f'⚠️  TENANT_ID ISSUES ({len(results["tenant_id_issues"])} modules):')
        for module in sorted(results['tenant_id_issues']):
            print(f'   - {module}: Missing tenant_id field in schema')
    else:
        print('✅ All modules have tenant_id field')
    
    if results['security_issues']:
        print(f'\n⚠️  SECURITY ISSUES ({len(results["security_issues"])} total):')
        seen = set()
        for module, issue in results['security_issues']:
            if issue not in seen:
                print(f'   - {module}: {issue}')
                seen.add(issue)
    else:
        print('✅ No security issues detected')
    
    print()
    print('=' * 90)
    
    return results

if __name__ == '__main__':
    validate_all_schemas()
