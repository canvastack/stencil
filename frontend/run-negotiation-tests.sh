#!/bin/bash

# Two-Way Negotiation Frontend Test Runner
# Runs Playwright E2E tests for negotiation scenarios

echo "=================================="
echo "Two-Way Negotiation Frontend Tests"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from frontend directory${NC}"
    exit 1
fi

# Parse arguments
SCENARIO=""
UI_MODE=""
HEADED=""
DEBUG=""
REPORT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --scenario)
            SCENARIO="$2"
            shift 2
            ;;
        --ui)
            UI_MODE="--ui"
            shift
            ;;
        --headed)
            HEADED="--headed"
            shift
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        --report)
            REPORT="--reporter=html"
            shift
            ;;
        --help)
            echo "Usage: ./run-negotiation-tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --scenario N    Run specific scenario (1-10)"
            echo "  --ui            Run in UI mode (interactive)"
            echo "  --headed        Run with visible browser"
            echo "  --debug         Run with debug mode"
            echo "  --report        Generate HTML report"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-negotiation-tests.sh                    # Run all tests"
            echo "  ./run-negotiation-tests.sh --scenario 1       # Run scenario 1"
            echo "  ./run-negotiation-tests.sh --ui               # Interactive mode"
            echo "  ./run-negotiation-tests.sh --headed           # See browser"
            echo "  ./run-negotiation-tests.sh --report           # Generate report"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if Playwright is installed
if [ ! -d "node_modules/@playwright" ]; then
    echo -e "${YELLOW}Playwright not found. Installing...${NC}"
    npm install
    npx playwright install
fi

# Build test command
TEST_FILE="src/__tests__/e2e/two-way-negotiation.spec.ts"

if [ -n "$SCENARIO" ]; then
    echo -e "${YELLOW}Running Scenario $SCENARIO...${NC}"
    GREP_FILTER="-g \"Scenario $SCENARIO\""
else
    echo -e "${YELLOW}Running all scenarios...${NC}"
    GREP_FILTER=""
fi

echo ""

# Check if backend is running
echo -e "${BLUE}Checking backend status...${NC}"
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo -e "${YELLOW}Please start backend: cd backend && php artisan serve${NC}"
    exit 1
fi

# Check if frontend is running
echo -e "${BLUE}Checking frontend status...${NC}"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo -e "${YELLOW}Please start frontend: npm run dev${NC}"
    exit 1
fi

echo ""

# Run tests
if [ -n "$UI_MODE" ]; then
    npx playwright test $TEST_FILE $GREP_FILTER $UI_MODE
elif [ -n "$DEBUG" ]; then
    npx playwright test $TEST_FILE $GREP_FILTER --debug
else
    npx playwright test $TEST_FILE $GREP_FILTER $HEADED $REPORT
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    
    if [ -n "$REPORT" ]; then
        echo ""
        echo -e "${BLUE}Opening HTML report...${NC}"
        npx playwright show-report
    fi
    
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
