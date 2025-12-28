import '@testing-library/jest-dom';
import React from 'react';

// Mock import.meta for Vite environment variables
(global as any).import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3001/api'
    }
  }
};

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: useLayoutEffect') ||
       args[0].includes('Error loading dashboard') ||
       args[0].includes('Not implemented: HTMLFormElement'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch for tests
global.fetch = jest.fn() as jest.Mock;

// Mock Clerk authentication
jest.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-jwt-token'),
    isSignedIn: true,
    isLoaded: true,
    userId: 'test-user-id',
  }),
  ClerkProvider: ({ children }: any) => children,
  SignInButton: jest.fn(({ children }: any) => children),
  SignUpButton: jest.fn(({ children }: any) => children),
  UserButton: jest.fn(() => null),
  useUser: () => ({
    isSignedIn: true,
    isLoaded: true,
    user: { 
      id: 'test-user-id',
      primaryEmailAddress: { emailAddress: 'test@example.com' }
    }
  })
}));
