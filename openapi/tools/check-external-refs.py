#!/usr/bin/env python3
"""
Check if there are still external references
"""

import re
from pathlib import Path

def check_external_refs():
    print('=' * 60)
    print(' ' * 15 + 'CHECKING EXTERNAL REFERENCES')
    print('=' * 60)
    print()
    
    base_path = Path(__file__).parent.parent
    paths_dir = base_path / 'paths' / 'content-management'
    
    external_patterns = [
        r'\.\./\.\./components/',
        r'\.\./\.\./schemas/',
    ]
    
    total_external_refs = 0
    files_with_external = 0
    
    for path_file in sorted(paths_dir.glob('*.yaml')):
        module_name = path_file.stem
        
        try:
            with open(path_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            external_count = 0
            for pattern in external_patterns:
                matches = re.findall(pattern, content)
                external_count += len(matches)
            
            if external_count > 0:
                files_with_external += 1
                total_external_refs += external_count
                print(f'EXTERNAL {module_name:20} - {external_count:3} external refs found')
            else:
                print(f'CLEAN    {module_name:20} - no external refs')
                
        except Exception as e:
            print(f'ERROR    {module_name:20} - {str(e)[:30]}')
    
    print()
    print('=' * 60)
    print('SUMMARY')
    print('=' * 60)
    print(f'Files with external refs: {files_with_external}')
    print(f'Total external refs found: {total_external_refs}')
    
    if total_external_refs == 0:
        print('\nSUCCESS: All external references have been converted!')
    else:
        print(f'\nWARNING: {total_external_refs} external references still exist')
    
    print('=' * 60)

if __name__ == '__main__':
    check_external_refs()