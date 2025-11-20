import yaml
import re

with open('openapi.yaml', 'r', encoding='utf-8') as f:
    data = yaml.safe_load(f)
    
print("Total paths defined in openapi.yaml:")
print(f"  Total: {len(data.get('paths', {}))}")

# Check for paths that use $ref
ref_paths = []
for path, item in data.get('paths', {}).items():
    if isinstance(item, dict) and '$ref' in item:
        ref_paths.append((path, item['$ref']))

print(f"\nPaths using $ref: {len(ref_paths)}")
for path, ref in sorted(ref_paths)[:20]:
    print(f"  {path}")
    print(f"    -> {ref}")

# Group by file
files = {}
for path, ref in ref_paths:
    file = ref.split('#')[0]
    if file not in files:
        files[file] = []
    files[file].append(path)

print(f"\nRefs grouped by file:")
for file in sorted(files.keys()):
    print(f"  {file}: {len(files[file])} paths")
