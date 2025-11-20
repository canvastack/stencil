#!/usr/bin/env python3
import re

file_path = r'd:\worksites\canvastack\projects\stencil\openapi\paths\content-management\about.yaml'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all $ref patterns
refs = re.findall(r"\$ref:\s*['\"][^'\"]*\.yaml#[^'\"]*['\"]", content)
print(f"Found {len(refs)} $ref patterns")
print("\nFirst 10 refs:")
for i, ref in enumerate(refs[:10]):
    print(f"  {i+1}. {ref}")

# Now try to find refs without leading slash after #
pattern = r"(\$ref:\s*['\"]\.+/components\/(?:responses|parameters|schemas)\.yaml)#(?!/)"
matches = list(re.finditer(pattern, content))
print(f"\nMatches for pattern without / after #: {len(matches)}")

# Let's try a different approach
pattern2 = r"\$ref:\s*['\"]\.+/components\/\w+\.yaml#(?!/)"
matches2 = list(re.finditer(pattern2, content))
print(f"Matches for simpler pattern: {len(matches2)}")

if matches2:
    print("\nFirst 3 matches:")
    for i, match in enumerate(matches2[:3]):
        print(f"  {match.group(0)}")
