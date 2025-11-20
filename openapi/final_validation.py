#!/usr/bin/env python3
import yaml
import re
import os
import glob

base_path = r'd:\worksites\canvastack\projects\stencil\openapi'

def load_components():
    """Load all component definitions from component files"""
    components = {
        'parameters': {},
        'responses': {},
        'schemas': {}
    }
    
    # Load parameters
    with open(os.path.join(base_path, 'components/parameters.yaml'), 'r', encoding='utf-8') as f:
        components['parameters'] = yaml.safe_load(f) or {}
    
    # Load responses
    with open(os.path.join(base_path, 'components/responses.yaml'), 'r', encoding='utf-8') as f:
        components['responses'] = yaml.safe_load(f) or {}
    
    # Load schemas
    with open(os.path.join(base_path, 'components/schemas.yaml'), 'r', encoding='utf-8') as f:
        components['schemas'] = yaml.safe_load(f) or {}
    
    return components

def validate_refs_in_file(file_path, components):
    """Validate all $ref in a YAML file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all $ref patterns
    pattern = r"\$ref:\s*['\"]([^'\"]+\.yaml)#/([^'\"]+)['\"]"
    matches = re.findall(pattern, content)
    
    errors = []
    valid = 0
    
    for file_ref, fragment in matches:
        # Determine component type from file
        if 'parameters.yaml' in file_ref:
            comp_type = 'parameters'
        elif 'responses.yaml' in file_ref:
            comp_type = 'responses'
        elif 'schemas.yaml' in file_ref:
            comp_type = 'schemas'
        else:
            errors.append(f"  [UNKNOWN] {file_ref}#{fragment}")
            continue
        
        # Check if component exists
        if fragment not in components[comp_type]:
            errors.append(f"  [MISSING] {comp_type}: {fragment}")
        else:
            valid += 1
    
    return valid, errors

def main():
    print("Loading components...")
    components = load_components()
    
    print(f"  - Parameters: {len(components['parameters'])}")
    print(f"  - Responses: {len(components['responses'])}")
    print(f"  - Schemas: {len(components['schemas'])}")
    print()
    
    print("Validating references...")
    
    # Validate openapi.yaml
    print("\nopenapi.yaml:")
    valid, errors = validate_refs_in_file(
        os.path.join(base_path, 'openapi.yaml'),
        components
    )
    print(f"  Valid: {valid}")
    if errors:
        for error in errors[:5]:
            print(error)
        if len(errors) > 5:
            print(f"  ... and {len(errors) - 5} more errors")
    
    # Validate path files
    total_valid = valid
    total_errors = len(errors)
    
    path_files = glob.glob(os.path.join(base_path, 'paths/**/*.yaml'), recursive=True)
    
    for file_path in path_files:
        valid, errors = validate_refs_in_file(file_path, components)
        total_valid += valid
        total_errors += len(errors)
        
        if errors:
            rel_path = os.path.relpath(file_path, base_path)
            print(f"\n{rel_path}:")
            for error in errors[:3]:
                print(error)
            if len(errors) > 3:
                print(f"  ... and {len(errors) - 3} more errors")
    
    print(f"\n{'='*60}")
    print(f"VALIDATION SUMMARY")
    print(f"{'='*60}")
    print(f"Valid references: {total_valid}")
    print(f"Invalid references: {total_errors}")
    
    if total_errors == 0:
        print("\n[SUCCESS] All references are valid!")
    else:
        print(f"\n[ERROR] Found {total_errors} invalid references")

if __name__ == '__main__':
    main()
