#!/usr/bin/env python3
"""
Fix all OpenAPI $ref paths to use relative paths instead of internal fragments.
Converts: #/components/... -> ../../components/...
"""

import os
import re
import sys
from pathlib import Path
from datetime import datetime
import shutil

def get_relative_path_to_components(file_path):
    """Calculate relative path from file to components directory."""
    file_path = Path(file_path)
    # Find 'paths' directory in the path
    parts = file_path.parts
    if 'paths' not in parts:
        return '../../'  # Default fallback
    
    paths_idx = parts.index('paths')
    # Count directories after 'paths'
    depth = len(parts) - paths_idx - 2  # -2 because we skip 'paths' and filename
    
    return '../' * (depth + 1)

def fix_ref_in_file(file_path, dry_run=False):
    """Fix all internal component references in a YAML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, str(e)

    original_content = content
    changes = []

    # Pattern: $ref: '#/components/...
    # Replace with relative path: $ref: '../../components/...
    
    patterns = [
        # Parameters
        (r"(\$ref:\s+['\"])#/components/parameters/([^'\"]+)(['\"])", 
         lambda m, rel: f"{m.group(1)}{rel}components/parameters.yaml#{m.group(2)}{m.group(3)}"),
        
        # Responses
        (r"(\$ref:\s+['\"])#/components/responses/([^'\"]+)(['\"])", 
         lambda m, rel: f"{m.group(1)}{rel}components/responses.yaml#{m.group(2)}{m.group(3)}"),
        
        # Schemas
        (r"(\$ref:\s+['\"])#/components/schemas/([^'\"]+)(['\"])", 
         lambda m, rel: f"{m.group(1)}{rel}components/schemas.yaml#{m.group(2)}{m.group(3)}"),
    ]

    rel_path = get_relative_path_to_components(file_path)

    for pattern, replacement in patterns:
        matches = re.finditer(pattern, content)
        for match in matches:
            old_ref = match.group(0)
            new_ref = replacement(match, rel_path)
            content = content.replace(old_ref, new_ref, 1)
            changes.append({
                'old': old_ref,
                'new': new_ref,
                'line': content[:match.start()].count('\n') + 1
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
    dry_run = '--dry-run' in sys.argv
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    
    openapi_root = Path(__file__).parent.parent
    paths_dir = openapi_root / 'paths'
    
    if not paths_dir.exists():
        print(f"❌ Paths directory not found: {paths_dir}")
        return 1

    print(f"{'[DRY RUN MODE]' if dry_run else '[FIX MODE]'}")
    print(f"Processing files in: {paths_dir}\n")
    
    yaml_files = list(paths_dir.rglob('*.yaml'))
    
    if not yaml_files:
        print("[ERROR] No YAML files found")
        return 1

    print(f"[INFO] Found {len(yaml_files)} YAML files\n")

    total_changes = 0
    files_modified = 0
    files_error = 0
    
    for yaml_file in sorted(yaml_files):
        rel_path = yaml_file.relative_to(openapi_root)
        changes, status = fix_ref_in_file(yaml_file, dry_run=dry_run)
        
        if changes is None:
            if verbose:
                print(f"[OK] {rel_path}: {status}")
        elif isinstance(changes, str):
            print(f"[ERROR] {rel_path}: {changes}")
            files_error += 1
        else:
            print(f"[{'DRY' if dry_run else 'FIXED'}] {rel_path}")
            print(f"   Changes: {len(changes)}")
            
            if verbose and changes:
                for change in changes[:3]:  # Show first 3
                    print(f"   Line {change['line']}: {change['old'][:50]}...")
                if len(changes) > 3:
                    print(f"   ... and {len(changes) - 3} more")
            
            total_changes += len(changes)
            files_modified += 1

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"   Files processed: {len(yaml_files)}")
    print(f"   Files modified: {files_modified}")
    print(f"   Total ref fixes: {total_changes}")
    print(f"   Errors: {files_error}")
    print(f"{'='*60}")
    
    if dry_run:
        print(f"\nTip: Run without --dry-run to apply changes")
    
    return 0 if files_error == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
