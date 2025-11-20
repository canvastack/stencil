import yaml
import os
import re
from collections import defaultdict

# Load all schemas
with open('components/schemas.yaml', 'r', encoding='utf-8') as f:
    schemas_data = yaml.safe_load(f)
    defined_schemas = set(schemas_data.keys())

print(f"Defined schemas: {len(defined_schemas)}")

# Find all schema references
missing_schemas = set()
reference_files = defaultdict(list)

def find_refs_in_file(filepath, relpath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Find all $ref patterns
            refs = re.findall(r'\$ref:\s*[\'"]([^\'"]+)[\'"]', content)
            for ref in refs:
                if 'schemas.yaml#/' in ref:
                    # Extract schema name
                    match = re.search(r'#/([^/]+)$', ref)
                    if match:
                        schema_name = match.group(1)
                        if schema_name not in defined_schemas:
                            missing_schemas.add(schema_name)
                            reference_files[schema_name].append((relpath, ref))
    except Exception as e:
        pass

# Scan all YAML files
for root, dirs, files in os.walk('paths'):
    for file in files:
        if file.endswith('.yaml') and not file.endswith('.bak'):
            filepath = os.path.join(root, file)
            relpath = os.path.relpath(filepath, '.')
            find_refs_in_file(filepath, relpath)

for file in os.listdir('components'):
    if file.endswith('.yaml') and not file.endswith('.bak'):
        filepath = os.path.join('components', file)
        find_refs_in_file(filepath, filepath)

print(f"\nMissing schemas: {len(missing_schemas)}")
print("\nFirst 50 missing schemas:")
for schema in sorted(missing_schemas)[:50]:
    print(f"  {schema}")
    
if len(missing_schemas) > 50:
    print(f"  ... and {len(missing_schemas) - 50} more")
