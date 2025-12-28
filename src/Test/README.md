# 🧪 Test Suite Documentation

## Overview

This project has a comprehensive test suite covering **business logic, domain models, and core utilities** with extensive edge case testing.

## 📊 Current Coverage

- **Total Tests**: 175
- **Test Suites**: 6
- **Domain Layer**: 96%+ coverage
- **Status**: ✅ All tests passing

## 🏗️ Test Structure

```
src/Test/
├── setup.ts                   # Test configuration and global mocks
├── Account.test.ts            # Account domain model tests (29 tests)
├── Money.test.ts              # Money value object tests (basic)
├── Money.enhanced.test.ts     # Money extended tests (60+ tests)
├── Transaction.test.ts        # Transaction model tests
├── utils.test.ts              # Utility functions tests (55+ tests)
└── App.test.tsx               # App component tests (30+ tests)
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run specific test file
npm test Account.test.ts

# Run tests matching pattern
npm test Money
```

### Debug Mode

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome
```

## 📝 Test Categories

### 1️⃣ Domain Model Tests

#### Account.ts (100% Coverage)
Tests account operations including deposits, withdrawals, and balance management.

**Key Test Cases**:
- ✅ Deposits (positive, negative, zero, large amounts)
- ✅ Withdrawals (sufficient/insufficient funds)
- ✅ Credit card overdraft support
- ✅ Timestamp updates
- ✅ All account types
- ✅ Multiple operation sequences

#### Money.ts (100% Coverage)
Tests the Money value object with comprehensive edge cases.

**Key Test Cases**:
- ✅ Creation methods (fromCents, fromMajor, zero)
- ✅ Arithmetic operations (add, subtract)
- ✅ Currency validation
- ✅ Money allocation by ratios
- ✅ Formatting and display
- ✅ Immutability
- ✅ Edge cases (max int, 1 cent, negative)

#### Transaction.ts (100% Coverage)
Tests transaction models and validation.

### 2️⃣ Utility Tests

#### utils.ts (100% Coverage)
Tests all utility functions with edge cases.

**Key Test Cases**:
- ✅ Currency formatting (all currencies, edge cases)
- ✅ Date formatting (various formats)
- ✅ Currency parsing (symbols, decimals)
- ✅ Validation (email, positive numbers)
- ✅ String utilities (truncate, capitalize)
- ✅ Debounce functionality
- ✅ ID generation

### 3️⃣ Component Tests

#### App.tsx (100% Coverage)
Tests the main App component including navigation and theming.

**Key Test Cases**:
- ✅ Initial render and navigation
- ✅ Page switching
- ✅ Theme management (light/dark/system)
- ✅ Theme persistence
- ✅ System preference detection
- ✅ Accessibility

## 🎯 Testing Philosophy

### We Follow These Principles:

1. **AAA Pattern**: Arrange → Act → Assert
2. **Single Responsibility**: Each test checks one thing
3. **Descriptive Names**: Clear test descriptions
4. **No Interdependence**: Tests run in any order
5. **Type Safety**: Full TypeScript coverage
6. **Edge Cases**: Boundary conditions tested
7. **Isolation**: Components tested independently

### Example Test Structure:

```typescript
describe('FeatureName', () => {
  describe('Specific functionality', () => {
    it('should do something specific', () => {
      // Arrange: Setup test data
      const input = 100;
      
      // Act: Execute the functionality
      const result = someFunction(input);
      
      // Assert: Verify the outcome
      expect(result).toBe(expectedValue);
    });
  });
});
```

## 🧰 Testing Tools

### Frameworks & Libraries
- **Jest**: Testing framework
- **@testing-library/react**: React component testing
- **@testing-library/jest-dom**: DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **ts-jest**: TypeScript support

### Configured Mocks
- `window.matchMedia` - For theme system testing
- `localStorage` - For persistence testing
- `fetch` - For API calls
- `console.error` - Suppressed in tests

## ✅ Writing New Tests

### 1. Create Test File

Place test files next to the code they test or in `src/Test/`:

```bash
src/
├── MyComponent.tsx
└── Test/
    └── MyComponent.test.tsx
```

### 2. Import Testing Utilities

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';
```

### 3. Write Test Cases

```typescript
describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 4. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle empty input', () => {
    // Test behavior with empty/null/undefined
  });

  it('should handle large numbers', () => {
    // Test with MAX_SAFE_INTEGER
  });

  it('should handle invalid input', () => {
    // Test error handling
  });
});
```

## 🐛 Debugging Tests

### View Test Output

```bash
# Verbose mode
npm test -- --verbose

# Show console.log in tests
npm test -- --silent=false
```

### Debug Failed Tests

```bash
# Run only failed tests
npm test -- --onlyFailures

# Run specific test by name
npm test -- -t "should handle negative amounts"
```

### Check Coverage for Specific File

```bash
npm test -- --coverage --collectCoverageFrom="src/Money.ts"
```

## 📈 Coverage Goals

### Current Thresholds
- Statements: 50%
- Branches: 50%
- Functions: 50%
- Lines: 50%

### Domain Layer Achievement
- Statements: 96%+
- Branches: 97%+
- Functions: 100%
- Lines: 96%+

## 🔍 Common Testing Patterns

### Testing Async Operations

```typescript
it('should load data asynchronously', async () => {
  render(<MyComponent />);
  
  // Wait for element to appear
  const element = await screen.findByText('Loaded');
  expect(element).toBeInTheDocument();
});
```

### Testing User Input

```typescript
it('should update on user input', () => {
  render(<MyForm />);
  
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'test' } });
  
  expect(input).toHaveValue('test');
});
```

### Testing Error States

```typescript
it('should display error message', async () => {
  // Mock API to return error
  global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
  
  render(<MyComponent />);
  
  const error = await screen.findByText(/error/i);
  expect(error).toBeInTheDocument();
});
```

### Mocking Functions

```typescript
it('should call callback', () => {
  const mockCallback = jest.fn();
  render(<MyComponent onSave={mockCallback} />);
  
  fireEvent.click(screen.getByText('Save'));
  
  expect(mockCallback).toHaveBeenCalledTimes(1);
  expect(mockCallback).toHaveBeenCalledWith(expectedData);
});
```

## 📚 Further Reading

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing Tests

When adding new features:

1. ✅ Write tests first (TDD approach)
2. ✅ Cover happy path
3. ✅ Cover edge cases
4. ✅ Cover error states
5. ✅ Maintain >90% coverage for domain logic
6. ✅ Update this documentation

## 📊 Viewing Coverage Reports

After running tests with coverage:

```bash
npm run test:coverage
```

HTML report is generated in `coverage/lcov-report/index.html`:

```bash
# Open coverage report in browser (Linux)
xdg-open coverage/lcov-report/index.html

# Or manually navigate to:
# coverage/lcov-report/index.html
```

## 🎓 Test Examples

Check these files for comprehensive examples:
- `src/Test/Money.enhanced.test.ts` - Value object testing
- `src/Test/Account.test.ts` - Entity testing
- `src/Test/utils.test.ts` - Pure function testing
- `src/Test/App.test.tsx` - React component testing

---

**Happy Testing! 🚀**

For questions or issues, check the main [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) for detailed coverage information.
