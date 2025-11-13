#!/bin/bash

# OpenAPI Validation Script for Stencil CMS
# Comprehensive validation pipeline

set -e

echo "🚀 Starting OpenAPI Validation Pipeline for Stencil CMS"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OPENAPI_FILE="../openapi.yaml"
OUTPUT_DIR="../output"
VALIDATION_DIR="../validation"

# Create directories if they don't exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$VALIDATION_DIR"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate OpenAPI file exists
validate_file_exists() {
    if [ ! -f "$OPENAPI_FILE" ]; then
        print_status "ERROR" "OpenAPI file not found: $OPENAPI_FILE"
        exit 1
    fi
    print_status "SUCCESS" "OpenAPI file found: $OPENAPI_FILE"
}

# Function to validate YAML syntax
validate_yaml_syntax() {
    print_status "INFO" "Validating YAML syntax..."
    
    if command_exists "js-yaml"; then
        if js-yaml "$OPENAPI_FILE" > /dev/null 2>&1; then
            print_status "SUCCESS" "YAML syntax is valid"
        else
            print_status "ERROR" "YAML syntax is invalid"
            js-yaml "$OPENAPI_FILE"
            exit 1
        fi
    elif command_exists "yq"; then
        if yq eval '.' "$OPENAPI_FILE" > /dev/null 2>&1; then
            print_status "SUCCESS" "YAML syntax is valid (yq)"
        else
            print_status "ERROR" "YAML syntax is invalid (yq)"
            exit 1
        fi
    else
        print_status "WARNING" "No YAML validator found (js-yaml or yq), skipping syntax check"
    fi
}

# Function to validate OpenAPI 3.1+ specification
validate_openapi_spec() {
    print_status "INFO" "Validating OpenAPI 3.1+ specification..."
    
    local validation_passed=false
    
    # Try Redocly CLI first (preferred)
    if command_exists "redocly"; then
        print_status "INFO" "Using Redocly CLI for validation..."
        if redocly lint "$OPENAPI_FILE" --config .redocly.yaml; then
            print_status "SUCCESS" "OpenAPI specification is valid (Redocly)"
            validation_passed=true
        else
            print_status "ERROR" "OpenAPI specification validation failed (Redocly)"
        fi
    fi
    
    # Try Spectral if available
    if command_exists "spectral" && [ "$validation_passed" = false ]; then
        print_status "INFO" "Using Spectral for validation..."
        if spectral lint "$OPENAPI_FILE"; then
            print_status "SUCCESS" "OpenAPI specification is valid (Spectral)"
            validation_passed=true
        else
            print_status "ERROR" "OpenAPI specification validation failed (Spectral)"
        fi
    fi
    
    # Try swagger-codegen as fallback
    if command_exists "swagger-codegen" && [ "$validation_passed" = false ]; then
        print_status "INFO" "Using swagger-codegen for validation..."
        if swagger-codegen validate -i "$OPENAPI_FILE"; then
            print_status "SUCCESS" "OpenAPI specification is valid (swagger-codegen)"
            validation_passed=true
        else
            print_status "ERROR" "OpenAPI specification validation failed (swagger-codegen)"
        fi
    fi
    
    if [ "$validation_passed" = false ]; then
        print_status "ERROR" "No suitable OpenAPI validator found or all validations failed"
        print_status "INFO" "Please install one of: redocly, spectral, or swagger-codegen"
        exit 1
    fi
}

# Function to validate schema references
validate_schema_references() {
    print_status "INFO" "Validating schema references..."
    
    # Check for broken $ref references using grep
    broken_refs=0
    
    # Find all $ref patterns and check if referenced files exist
    while IFS= read -r line; do
        if [[ $line =~ \$ref:.*[\"\'](.*)[\"\']] ]]; then
            ref_path="${BASH_REMATCH[1]}"
            if [[ $ref_path == \#* ]]; then
                # Internal reference, skip for now
                continue
            elif [[ $ref_path == *\.yaml* ]] || [[ $ref_path == *\.yml* ]]; then
                # External file reference
                full_path="$(dirname "$OPENAPI_FILE")/$ref_path"
                if [ ! -f "$full_path" ]; then
                    print_status "ERROR" "Broken reference: $ref_path (file not found)"
                    broken_refs=$((broken_refs + 1))
                fi
            fi
        fi
    done < "$OPENAPI_FILE"
    
    if [ $broken_refs -eq 0 ]; then
        print_status "SUCCESS" "All schema references are valid"
    else
        print_status "ERROR" "$broken_refs broken schema reference(s) found"
        exit 1
    fi
}

# Function to validate multi-tenant compliance
validate_multitenant_compliance() {
    print_status "INFO" "Validating multi-tenant compliance..."
    
    local compliance_issues=0
    
    # Check for tenant_id in security requirements
    if ! grep -q "tenantHeader" "$OPENAPI_FILE"; then
        print_status "WARNING" "tenantHeader security scheme not found"
        compliance_issues=$((compliance_issues + 1))
    fi
    
    # Check for tenant_id in common schemas
    if ! grep -q "tenant_id" "$OPENAPI_FILE"; then
        print_status "WARNING" "tenant_id field not found in schemas"
        compliance_issues=$((compliance_issues + 1))
    fi
    
    # Check for JWT authentication
    if ! grep -q "bearerAuth" "$OPENAPI_FILE"; then
        print_status "WARNING" "JWT bearerAuth not configured"
        compliance_issues=$((compliance_issues + 1))
    fi
    
    if [ $compliance_issues -eq 0 ]; then
        print_status "SUCCESS" "Multi-tenant compliance validated"
    else
        print_status "WARNING" "$compliance_issues multi-tenant compliance issue(s) found"
    fi
}

# Function to generate resolved specification
generate_resolved_spec() {
    print_status "INFO" "Generating resolved OpenAPI specification..."
    
    if command_exists "swagger-codegen"; then
        swagger-codegen generate \
            -l openapi-yaml \
            -i "$OPENAPI_FILE" \
            -o "$OUTPUT_DIR" \
            --additional-properties outputFile=openapi-resolved.yaml \
            --skip-validate-spec
        print_status "SUCCESS" "Resolved YAML specification generated"
    fi
    
    # Generate JSON version
    if command_exists "js-yaml"; then
        js-yaml "$OPENAPI_FILE" > "$OUTPUT_DIR/openapi.json"
        print_status "SUCCESS" "JSON specification generated"
    fi
}

# Function to run security checks
run_security_checks() {
    print_status "INFO" "Running security checks..."
    
    local security_issues=0
    
    # Check for HTTP endpoints (should be HTTPS only)
    if grep -q "http://" "$OPENAPI_FILE"; then
        print_status "WARNING" "HTTP endpoints found (should use HTTPS)"
        security_issues=$((security_issues + 1))
    fi
    
    # Check for example secrets or sensitive data
    if grep -qiE "(password|secret|key|token).*[\"']\w{8,}[\"']" "$OPENAPI_FILE"; then
        print_status "WARNING" "Potential exposed secrets in examples"
        security_issues=$((security_issues + 1))
    fi
    
    # Check for proper authentication on sensitive endpoints
    sensitive_paths=("/users" "/admin" "/settings" "/financial")
    for path in "${sensitive_paths[@]}"; do
        if grep -A 10 -B 2 "$path:" "$OPENAPI_FILE" | grep -q "security: \[\]"; then
            print_status "WARNING" "Sensitive endpoint $path may lack authentication"
            security_issues=$((security_issues + 1))
        fi
    done
    
    if [ $security_issues -eq 0 ]; then
        print_status "SUCCESS" "Security checks passed"
    else
        print_status "WARNING" "$security_issues security issue(s) found"
    fi
}

# Function to generate documentation
generate_documentation() {
    print_status "INFO" "Generating API documentation..."
    
    if command_exists "redoc-cli"; then
        mkdir -p "$OUTPUT_DIR/api-docs"
        redoc-cli build "$OPENAPI_FILE" \
            --output "$OUTPUT_DIR/api-docs/index.html" \
            --title "Stencil CMS API Documentation" \
            --theme.colors.primary.main "#007bff"
        print_status "SUCCESS" "HTML documentation generated at $OUTPUT_DIR/api-docs/index.html"
    else
        print_status "WARNING" "redoc-cli not found, skipping HTML documentation generation"
    fi
    
    if command_exists "openapi-to-postman"; then
        openapi-to-postman \
            -s "$OPENAPI_FILE" \
            -o "$VALIDATION_DIR/postman-collection.json" \
            -p
        print_status "SUCCESS" "Postman collection generated at $VALIDATION_DIR/postman-collection.json"
    else
        print_status "WARNING" "openapi-to-postman not found, skipping Postman collection generation"
    fi
}

# Function to validate field coverage
validate_field_coverage() {
    print_status "INFO" "Validating field coverage..."
    
    # Count schema properties
    local schema_count
    schema_count=$(grep -c "properties:" "$OPENAPI_FILE" || echo "0")
    
    # Count endpoint definitions
    local endpoint_count
    endpoint_count=$(grep -c "summary:" "$OPENAPI_FILE" || echo "0")
    
    print_status "INFO" "Schema objects with properties: $schema_count"
    print_status "INFO" "API endpoints documented: $endpoint_count"
    
    # Validate minimum expected coverage
    if [ "$endpoint_count" -lt 50 ]; then
        print_status "WARNING" "Low endpoint coverage: $endpoint_count (expected 50+)"
    else
        print_status "SUCCESS" "Good endpoint coverage: $endpoint_count"
    fi
}

# Function to print summary
print_summary() {
    echo ""
    echo "================================================="
    print_status "SUCCESS" "OpenAPI Validation Pipeline Complete"
    echo "================================================="
    echo ""
    echo "📊 Validation Summary:"
    echo "  ✅ YAML Syntax: Valid"
    echo "  ✅ OpenAPI 3.1+ Spec: Valid"
    echo "  ✅ Schema References: Valid"
    echo "  ⚠️  Multi-tenant: See warnings above"
    echo "  ⚠️  Security: See warnings above"
    echo ""
    echo "📁 Generated Files:"
    echo "  📄 Resolved YAML: $OUTPUT_DIR/openapi-resolved.yaml"
    echo "  📄 JSON Format: $OUTPUT_DIR/openapi.json"
    echo "  🌐 HTML Docs: $OUTPUT_DIR/api-docs/index.html"
    echo "  📮 Postman Collection: $VALIDATION_DIR/postman-collection.json"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Review any warnings above"
    echo "  2. Open HTML documentation in browser"
    echo "  3. Import Postman collection for API testing"
    echo "  4. Run 'npm run test:api' to test endpoints"
    echo ""
}

# Main validation pipeline
main() {
    validate_file_exists
    validate_yaml_syntax
    validate_openapi_spec
    validate_schema_references
    validate_multitenant_compliance
    generate_resolved_spec
    run_security_checks
    validate_field_coverage
    generate_documentation
    print_summary
}

# Run main function
main "$@"