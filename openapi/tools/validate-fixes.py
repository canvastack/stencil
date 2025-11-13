#!/usr/bin/env python3
"""
Quick validation script to check if critical issues are fixed
"""

import os
import yaml
import sys
from pathlib import Path

def check_tenant_id_compliance():
    """Check if all modules are using BaseEntity (which includes tenant_id)"""
    
    schemas_dir = Path(__file__).parent / "schemas" / "content-management"
    issues = []
    
    print("🔍 Checking tenant_id compliance...")
    
    for yaml_file in schemas_dir.glob("*.yaml"):
        print(f"  Checking {yaml_file.name}...")
        
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check if the file uses BaseEntity reference
            if 'BaseEntity' not in content:
                issues.append(f"❌ {yaml_file.name}: No BaseEntity reference found")
            else:
                print(f"    ✅ Uses BaseEntity")
                
            # Check for invalid TenantEntity references
            if 'TenantEntity' in content:
                issues.append(f"❌ {yaml_file.name}: Still uses invalid TenantEntity reference")
            else:
                print(f"    ✅ No invalid TenantEntity references")
                
        except Exception as e:
            issues.append(f"❌ {yaml_file.name}: Error reading file - {e}")
    
    return issues

def check_entity_conflicts():
    """Check for duplicate entity names across modules"""
    
    schemas_dir = Path(__file__).parent / "schemas" / "content-management"
    entity_map = {}
    conflicts = []
    
    print("\n🔍 Checking entity name conflicts...")
    
    for yaml_file in schemas_dir.glob("*.yaml"):
        print(f"  Checking {yaml_file.name}...")
        
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Simple regex to find entity definitions
            lines = content.split('\n')
            for i, line in enumerate(lines):
                # Look for entity definitions (lines that start with a word and end with colon)
                if line and not line.startswith(' ') and not line.startswith('#') and line.endswith(':'):
                    entity_name = line.rstrip(':')
                    if entity_name and entity_name[0].isupper():  # Likely an entity
                        if entity_name in entity_map:
                            conflicts.append(f"❌ Entity '{entity_name}' found in both {entity_map[entity_name]} and {yaml_file.name}")
                        else:
                            entity_map[entity_name] = yaml_file.name
                            
        except Exception as e:
            print(f"    ❌ Error reading {yaml_file.name}: {e}")
    
    if not conflicts:
        print("    ✅ No entity name conflicts found")
    
    return conflicts

def check_base_entities():
    """Check if all required base entities exist in base.yaml"""
    
    base_file = Path(__file__).parent / "schemas" / "common" / "base.yaml"
    required_entities = ['BaseEntity', 'AuditableEntity', 'AuditEntity', 'VisibilityEntity']
    issues = []
    
    print("\n🔍 Checking base entities...")
    
    try:
        with open(base_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for entity in required_entities:
            if f"{entity}:" in content:
                print(f"    ✅ {entity} exists")
            else:
                issues.append(f"❌ Missing {entity} in base.yaml")
                
    except Exception as e:
        issues.append(f"❌ Error reading base.yaml: {e}")
    
    return issues

def main():
    print("🚀 Running OpenAPI Schema Fixes Validation")
    print("=" * 50)
    
    all_issues = []
    
    # Check tenant_id compliance
    tenant_issues = check_tenant_id_compliance()
    all_issues.extend(tenant_issues)
    
    # Check entity conflicts
    conflict_issues = check_entity_conflicts()
    all_issues.extend(conflict_issues)
    
    # Check base entities
    base_issues = check_base_entities()
    all_issues.extend(base_issues)
    
    print("\n" + "=" * 50)
    print("📊 VALIDATION SUMMARY")
    print("=" * 50)
    
    if not all_issues:
        print("✅ ALL CRITICAL ISSUES FIXED!")
        print("🎉 Multi-tenant architecture compliance: PASSED")
        print("🎉 Entity naming conflicts: RESOLVED")
        print("🎉 Base entity structure: COMPLETE")
        return 0
    else:
        print(f"❌ Found {len(all_issues)} issues:")
        for issue in all_issues:
            print(f"  {issue}")
        return 1

if __name__ == "__main__":
    sys.exit(main())