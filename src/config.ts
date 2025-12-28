const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_API_URL) {
    return (window as any).import.meta.env.VITE_API_URL;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return 'http://localhost:3001/api';
};

export const API_URL = getApiUrl();
