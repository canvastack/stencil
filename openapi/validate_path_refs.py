import yaml
import os
import re

# Load all path files and collect available paths
available_paths = {}

for root, dirs, files in os.walk('paths'):
    for file in files:
        if file.endswith('.yaml') and not file.endswith('.bak'):
            filepath = os.path.join(root, file)
            relpath = os.path.relpath(filepath, '.')
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    paths = [k for k in data.keys() if isinstance(k, str) and k.startswith('/')]
                    available_paths[relpath] = paths
            except Exception as e:
                print(f"Error reading {relpath}: {e}")

# Now check openapi.yaml references
with open('openapi.yaml', 'r', encoding='utf-8') as f:
    openapi_data = yaml.safe_load(f)

invalid_refs = []

for path, item in openapi_data.get('paths', {}).items():
    if isinstance(item, dict) and '$ref' in item:
        ref = item['$ref']
        # Parse ref: ./paths/content-management/inventory.yaml#/~1tenant~1inventory~1items
        match = re.match(r'(\..*\.yaml)#(.*)', ref)
        if match:
            file_ref = match.group(1)
            fragment = match.group(2)
            
            # Decode fragment
            # #/~1tenant~1inventory~1items -> /tenant/inventory/items
            decoded = fragment.replace('~1', '/').replace('~0', '~')
            
            # Find the actual file
            actual_file = None
            for avail_file in available_paths.keys():
                if avail_file.endswith(file_ref):
                    actual_file = avail_file
                    break
            
            if actual_file:
                # Check if path exists
                if decoded not in available_paths[actual_file]:
                    invalid_refs.append({
                        'openapi_path': path,
                        'ref': ref,
                        'file': actual_file,
                        'looking_for': decoded,
                        'available': available_paths[actual_file]
                    })
            else:
                print(f"File not found: {file_ref}")

print(f"Invalid references: {len(invalid_refs)}")
for inv in invalid_refs[:10]:
    print(f"\nOpenAPI path: {inv['openapi_path']}")
    print(f"  Reference: {inv['ref']}")
    print(f"  Looking for: {inv['looking_for']}")
    print(f"  In file: {inv['file']}")
    if inv['looking_for'].startswith('/'):
        # Try to find a similar path
        prefix = inv['looking_for'].split('/')[1]
        similar = [p for p in inv['available'] if p.startswith('/' + prefix)]
        if similar:
            print(f"  Available paths with prefix '{prefix}': {similar[:3]}")
