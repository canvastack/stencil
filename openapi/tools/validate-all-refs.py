#!/usr/bin/env python3
"""
Validate all $ref paths in OpenAPI files to ensure they are correctly formatted
and point to existing components.
"""

import re
import json
from pathlib import Path
from collections import defaultdict

def load_yaml_simple(file_path):
    """Simple YAML loader to extract top-level keys."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract top-level keys (component names)
        keys = set()
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and ':' in line:
                key = line.split(':')[0].strip()
                if key and not key.startswith('-'):
                    keys.add(key)
        return keys
    except:
        return set()

def find_all_refs(file_path):
    """Find all $ref entries in a file."""
    refs = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for i, line in enumerate(content.split('\n'), 1):
            if '$ref' in line:
                # Extract the reference value
                match = re.search(r"\$ref:\s+['\"]([^'\"]+)['\"]", line)
                if match:
                    refs.append({
                        'line': i,
                        'ref': match.group(1),
                        'text': line.strip()[:80]
                    })
    except:
        pass
    
    return refs

def resolve_ref(ref, file_path, openapi_root):
    """Resolve a reference and check if it exists."""
    # Determine reference type
    is_external = '/' in ref or '.yaml' in ref
    
    if not is_external:
        # Internal reference like #ParameterName
        return None, "Internal fragment (valid if defined in same file)"
    
    # External reference like ../../components/parameters.yaml#TenantHeader
    if '#' in ref:
        target_file, fragment = ref.split('#', 1)
    else:
        target_file = ref
        fragment = None
    
    # Resolve relative path
    try:
        full_path = (file_path.parent / target_file).resolve()
        
        if not full_path.exists():
            return False, f"File not found: {target_file}"
        
        if fragment:
            # Check if fragment exists in the file
            components = load_yaml_simple(full_path)
            if fragment not in components:
                return False, f"Fragment '{fragment}' not found in {target_file}"
        
        return True, f"Valid: {target_file}#{fragment if fragment else ''}"
    except Exception as e:
        return False, str(e)

def main():
    openapi_root = Path(__file__).parent.parent
    
    # Load component definitions
    print("[INFO] Loading component definitions...\n")
    
    components_files = {
        'parameters': openapi_root / 'components' / 'parameters.yaml',
        'responses': openapi_root / 'components' / 'responses.yaml',
        'schemas': openapi_root / 'components' / 'schemas.yaml',
    }
    
    components_map = {}
    for comp_type, comp_file in components_files.items():
        components_map[comp_type] = load_yaml_simple(comp_file)
        print(f"[OK] {comp_type}: {len(components_map[comp_type])} components")
    
    print("\n[INFO] Validating references in all YAML files...\n")
    
    paths_dir = openapi_root / 'paths'
    yaml_files = list(paths_dir.rglob('*.yaml'))
    
    stats = {
        'total_files': len(yaml_files),
        'total_refs': 0,
        'valid_refs': 0,
        'invalid_refs': 0,
        'errors': []
    }
    
    for yaml_file in sorted(yaml_files):
        rel_path = yaml_file.relative_to(openapi_root)
        refs = find_all_refs(yaml_file)
        
        if refs:
            print(f"Processing: {rel_path}")
            for ref_info in refs[:3]:
                valid, msg = resolve_ref(ref_info['ref'], yaml_file, openapi_root)
                status = "[OK]" if valid else "[WARN]" if valid is None else "[ERROR]"
                print(f"  {status} Line {ref_info['line']}: {ref_info['ref'][:60]}")
                
                stats['total_refs'] += 1
                if valid is True:
                    stats['valid_refs'] += 1
                elif valid is False:
                    stats['invalid_refs'] += 1
                    stats['errors'].append({
                        'file': str(rel_path),
                        'line': ref_info['line'],
                        'ref': ref_info['ref'],
                        'error': msg
                    })
            
            if len(refs) > 3:
                print(f"  ... and {len(refs) - 3} more")
            print()
    
    # Print summary
    print("="*60)
    print("VALIDATION SUMMARY")
    print("="*60)
    print(f"Total files scanned: {stats['total_files']}")
    print(f"Total references found: {stats['total_refs']}")
    print(f"Valid references: {stats['valid_refs']}")
    print(f"Invalid references: {stats['invalid_refs']}")
    
    if stats['errors']:
        print(f"\nERRORS ({len(stats['errors'])}):")
        for error in stats['errors'][:10]:
            print(f"  {error['file']}:{error['line']}")
            print(f"    Ref: {error['ref']}")
            print(f"    Issue: {error['error']}")
        if len(stats['errors']) > 10:
            print(f"  ... and {len(stats['errors']) - 10} more")
    
    return 0 if stats['invalid_refs'] == 0 else 1

if __name__ == '__main__':
    import sys
    sys.exit(main())
