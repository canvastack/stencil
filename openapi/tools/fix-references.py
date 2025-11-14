#!/usr/bin/env python3
"""
Fix External References to Internal References
Converts external $ref to internal #/components format
"""

import os
import re
from pathlib import Path

def fix_references():
    """Fix external references to internal format"""
    
    print('=' * 90)
    print(' ' * 25 + 'FIXING EXTERNAL TO INTERNAL REFERENCES')
    print('=' * 90)
    print()
    
    base_path = Path(__file__).parent.parent.resolve()
    paths_dir = base_path / 'paths' / 'content-management'
    
    # Reference mapping patterns
    reference_patterns = {
        # Responses
        r'../../components/responses\.yaml#/(\w+)': r'#/components/responses/\1',
        
        # Schemas - content management
        r'../../schemas/content-management/(\w+)\.yaml#/(\w+)': r'#/components/schemas/\2',
        
        # Common schemas 
        r'../../schemas/common/base\.yaml#/(\w+)': r'#/components/schemas/\1',
        r'../../schemas/common/(\w+)\.yaml#/(\w+)': r'#/components/schemas/\2',
        
        # Parameters
        r'../../components/parameters\.yaml#/(\w+)': r'#/components/parameters/\1',
        
        # Other components
        r'../../components/schemas\.yaml#/(\w+)': r'#/components/schemas/\1',
    }
    
    files_processed = 0
    total_replacements = 0
    
    print('PROCESSING PATH FILES...')
    print('-' * 90)
    
    for path_file in sorted(paths_dir.glob('*.yaml')):
        module_name = path_file.stem
        replacements_made = 0
        
        try:
            # Read file content
            with open(path_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Apply each pattern
            for pattern, replacement in reference_patterns.items():
                matches = re.findall(pattern, content)
                if matches:
                    content = re.sub(pattern, replacement, content)
                    replacements_made += len(matches)
            
            # Write back if changes were made
            if content != original_content:
                with open(path_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                files_processed += 1
                total_replacements += replacements_made
                print(f'FIXED {module_name:20} - {replacements_made:3} references converted')
            else:
                print(f'SKIP  {module_name:20} - no external references found')
                
        except Exception as e:
            print(f'ERROR {module_name:20} - {str(e)[:50]}')
    
    print()
    print('=' * 90)
    print('SUMMARY')
    print('=' * 90)
    print(f'Files processed: {files_processed}')
    print(f'Total references converted: {total_replacements}')
    
    if total_replacements > 0:
        print('\nREFERENCE CONVERSION COMPLETED!')
        print('All external references have been converted to internal format.')
    else:
        print('\nNO REFERENCES TO CONVERT')
        print('All files already use internal references.')
    
    print('=' * 90)
    
    return files_processed, total_replacements

if __name__ == '__main__':
    fix_references()