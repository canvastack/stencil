import yaml

with open('paths/content-management/inventory.yaml', 'r') as f:
    data = yaml.safe_load(f)
    paths = [k for k in data.keys() if isinstance(k, str) and k.startswith('/')]
    print("Inventory paths:")
    for p in sorted(paths)[:20]:
        print(f"  {p}")
        
with open('paths/content-management/customers.yaml', 'r') as f:
    data = yaml.safe_load(f)
    paths = [k for k in data.keys() if isinstance(k, str) and k.startswith('/')]
    print("\nCustomers paths:")
    for p in sorted(paths)[:20]:
        print(f"  {p}")
