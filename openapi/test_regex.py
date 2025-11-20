#!/usr/bin/env python3
import re

test_string = "    - $ref: '../../components/parameters.yaml#TenantHeader'"

pattern = r"(\$ref:\s*['\"]\.+/components\/(?:responses|parameters|schemas)\.yaml)#([A-Za-z_][A-Za-z0-9_]*['\"])"

matches = re.findall(pattern, test_string)
print(f"Pattern: {pattern}")
print(f"Test string: {test_string}")
print(f"Matches: {matches}")

# Try a simpler pattern
pattern2 = r"(\$ref:\s*['\"]\.+/components\/\w+\.yaml)#(\w+['\"])"
matches2 = re.findall(pattern2, test_string)
print(f"\nPattern2: {pattern2}")
print(f"Matches2: {matches2}")

# Try to understand what's happening
import re
match = re.search(r"\$ref:\s*['\"][^'\"]*\.yaml#[A-Za-z_][A-Za-z0-9_]*['\"]", test_string)
if match:
    print(f"\nFound match: {match.group(0)}")
