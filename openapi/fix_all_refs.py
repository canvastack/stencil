#!/usr/bin/env python3
import re
import os
import glob

def fix_yaml_refs(file_path):
    """Fix external $ref fragments to add leading slash"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern: Match $ref: paths ending with .yaml#ComponentName where # is NOT followed by /
    # Matches: '../../components/TYPE.yaml#Component' or './components/TYPE.yaml#Component'
    # Should become: '.../components/TYPE.yaml#/Component'
    pattern = r"(\$ref:\s*['\"][^'\"]*\.yaml)#(?!/)"
    
    matches = list(re.finditer(pattern, content))
    
    if matches:
        print(f"\n{os.path.basename(file_path)}: Found {len(matches)} references to fix")
        
        # Show first few matches for debugging
        for i, match in enumerate(matches[:3]):
            start = max(0, match.start() - 10)
            end = min(len(content), match.end() + 30)
            print(f"  - ...{content[start:end]}...")
        
        if len(matches) > 3:
            print(f"  ... and {len(matches) - 3} more")
        
        # Perform replacement - add a / after the # if not already there
        content = re.sub(pattern, r"\1#/", content)
    
    # Only write if content changed
    if content != original_content:
        # Backup original if it doesn't exist
        backup_path = file_path + '.bak'
        if not os.path.exists(backup_path):
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
        
        # Write fixed content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return len(matches)
    
    return 0

def main():
    base_path = r'd:\worksites\canvastack\projects\stencil\openapi'
    
    # Fix paths files
    print("Fixing path files...")
    path_files = glob.glob(os.path.join(base_path, 'paths/**/*.yaml'), recursive=True)
    total_fixed = 0
    
    for file_path in path_files:
        fixed = fix_yaml_refs(file_path)
        if fixed > 0:
            total_fixed += fixed
    
    print(f"\nTotal references fixed in path files: {total_fixed}")
    print("All files processed successfully!")

if __name__ == '__main__':
    main()
