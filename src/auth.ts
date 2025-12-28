import { useAuth } from '@clerk/clerk-react';

export const useAuthenticatedFetch = () => {
  const { getToken } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    
    const headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };

    return fetch(url, {
      ...options,
      headers
    });
  };

  return authenticatedFetch;
};
