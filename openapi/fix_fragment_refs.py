#!/usr/bin/env python3
import re
import os

def fix_openapi_refs(file_path):
    """Fix external $ref fragments in openapi.yaml to add leading slash"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match $ref: './components/TYPE.yaml#ComponentName'
    # Should become $ref: './components/TYPE.yaml#/ComponentName'
    pattern = r"(\$ref:\s*['\"]\.\/components\/(?:responses|parameters|schemas)\.yaml)#([A-Za-z_][A-Za-z0-9_]*['\"])"
    
    replacement = r"\1#/\2"
    
    # Count matches
    matches = list(re.finditer(pattern, content))
    print(f"Found {len(matches)} references to fix")
    
    # Show first few matches
    for i, match in enumerate(matches[:5]):
        print(f"  {i+1}. {match.group(0)}")
    
    if len(matches) > 5:
        print(f"  ... and {len(matches) - 5} more")
    
    # Perform replacement
    fixed_content = re.sub(pattern, replacement, content)
    
    # Backup original
    backup_path = file_path + '.bak'
    if not os.path.exists(backup_path):
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\nBackup created: {backup_path}")
    
    # Write fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"\nFixed {len(matches)} references in {file_path}")
    print("Changes applied successfully!")

if __name__ == '__main__':
    fix_openapi_refs(r'd:\worksites\canvastack\projects\stencil\openapi\openapi.yaml')
