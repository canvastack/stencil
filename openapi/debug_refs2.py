#!/usr/bin/env python3
import re

test_cases = [
    "$ref: '../../components/parameters.yaml#TenantHeader'",
    "$ref: './components/parameters.yaml#TenantHeader'",
    "$ref: '../../components/parameters.yaml#/TenantHeader'"  # Already fixed
]

# Pattern to match refs that don't have / after #
# This needs to match ../../../components OR ./components OR components
pattern = r"\$ref:\s*['\"][^\]'\"]*\.yaml#(?!/)"

for test in test_cases:
    matches = re.findall(pattern, test)
    print(f"Test: {test}")
    print(f"  Matches: {len(matches) > 0}")
    print()
