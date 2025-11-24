#!/usr/bin/env python3
import yaml
import sys
import os

os.chdir(r'd:\worksites\canvastack\projects\stencil\openapi')

files_to_check = [
    'paths/content-management/about.yaml',
    'paths/content-management/orders.yaml',
    'paths/content-management/products.yaml'
]

for filepath in files_to_check:
    try:
        with open(filepath, 'r') as f:
            data = yaml.safe_load(f)
        
        if data and isinstance(data, dict):
            paths = sorted([k for k in data.keys() if isinstance(k, str) and k.startswith('/')])
            print(f"\n{filepath}: {len(paths)} paths")
            for p in paths[:15]:
                print(f"  {p}")
            if len(paths) > 15:
                print(f"  ... and {len(paths) - 15} more")
    except Exception as e:
        print(f"Error reading {filepath}: {e}", file=sys.stderr)
