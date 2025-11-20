#!/usr/bin/env python3
"""
Fix $ref paths in main openapi.yaml file.
Converts: #/components/... -> ./components/...
Removes leading '/' from fragments: ./components/schemas.yaml#/Name -> ./components/schemas.yaml#Name
"""

import re
import shutil
from pathlib import Path

def fix_openapi_file(file_path, dry_run=False):
    """Fix all references in the main openapi.yaml file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, str(e)

    original_content = content
    changes = []

    patterns = [
        # Fix fragment references with leading slash: #/ -> #
        (r"(\$ref:\s+['\"])([^'\"]*?)#/([^'\"]+)(['\"])",
         lambda m: f"{m.group(1)}{m.group(2)}#{m.group(3)}{m.group(4)}", 
         "Removing leading slash from fragment"),
    ]

    for pattern, replacement, desc in patterns:
        def replace_func(m):
            return replacement(m)
        
        matches = list(re.finditer(pattern, content))
        for match in reversed(matches):  # Process in reverse to maintain positions
            old_ref = match.group(0)
            new_ref = replace_func(match)
            if old_ref != new_ref:
                content = content[:match.start()] + new_ref + content[match.end():]
                changes.append({
                    'old': old_ref,
                    'new': new_ref,
                    'line': content[:match.start()].count('\n') + 1,
                    'desc': desc
                })

    if content == original_content:
        return None, "No changes needed"

    if not dry_run:
        # Backup original
        backup_path = str(file_path) + '.bak'
        shutil.copy2(file_path, backup_path)
        
        # Write fixed content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    return changes, "Success"

def main():
    import sys
    dry_run = '--dry-run' in sys.argv
    
    openapi_file = Path(__file__).parent.parent / 'openapi.yaml'
    
    if not openapi_file.exists():
        print(f"[ERROR] File not found: {openapi_file}")
        return 1

    print(f"[{'DRY RUN' if dry_run else 'FIX'}] Processing: {openapi_file.name}")
    
    changes, status = fix_openapi_file(openapi_file, dry_run=dry_run)
    
    if changes is None:
        print(f"[INFO] {status}")
        return 0
    elif isinstance(changes, str):
        print(f"[ERROR] {changes}")
        return 1
    else:
        print(f"[{'DRY' if dry_run else 'FIXED'}] Total changes: {len(changes)}")
        if changes:
            for i, change in enumerate(changes[:5]):
                print(f"  {i+1}. {change['desc']} at line {change['line']}")
                print(f"     Old: {change['old'][:60]}")
                print(f"     New: {change['new'][:60]}")
            if len(changes) > 5:
                print(f"  ... and {len(changes) - 5} more")
        
        if not dry_run:
            print(f"\nBackup created: {openapi_file}.bak")
        return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())
