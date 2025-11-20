#!/usr/bin/env python3
import re

file_path = r'd:\worksites\canvastack\projects\stencil\openapi\openapi.yaml'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Fix all path references that have #~1 but not #/~1
# Pattern: #(~[0-9]) that comes after yaml
pattern = r"(\.yaml)#(~[0-9])"

def replace_func(match):
    return match.group(1) + "#/" + match.group(2)

fixed = re.sub(pattern, replace_func, content)

if fixed != original:
    # Count changes
    matches = list(re.finditer(pattern, original))
    print(f"Fixed {len(matches)} path reference fragments")
    for i, m in enumerate(matches[:3]):
        before = original[m.start()-20:m.end()+10]
        print(f"  ...{before}...")
    if len(matches) > 3:
        print(f"  ... and {len(matches) - 3} more")
    
    # Write fixed
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed)
    
    print("\nChanges applied!")
else:
    print("No changes needed")
