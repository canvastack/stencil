import yaml

with open('paths/content-management/about.yaml', 'r', encoding='utf-8') as f:
    data = yaml.safe_load(f)
    paths = sorted([k for k in data.keys() if isinstance(k, str) and k.startswith('/')])
    print("Paths in about.yaml:")
    for p in paths:
        print(f"  {p}")
