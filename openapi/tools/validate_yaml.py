#!/usr/bin/env python3
import yaml
import sys

try:
    with open('../openapi.yaml', 'r', encoding='utf-8') as f:
        yaml.safe_load(f)
    print("YAML syntax is valid")
    sys.exit(0)
except yaml.YAMLError as e:
    print(f"YAML syntax error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)