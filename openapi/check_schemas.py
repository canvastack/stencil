import yaml

with open('components/schemas.yaml', 'r', encoding='utf-8') as f:
    data = yaml.safe_load(f)
    schemas = sorted([k for k in data.keys() if not k.startswith('_')])
    print(f"Total schemas: {len(schemas)}")
    print("\nFirst 30 schemas:")
    for s in schemas[:30]:
        print(f"  {s}")
    
    # Check for AboutHero
    if 'AboutHero' in data:
        print("\n✓ AboutHero found")
    else:
        print("\n✗ AboutHero NOT found")
