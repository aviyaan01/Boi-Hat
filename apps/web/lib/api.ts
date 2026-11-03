import { ApiResponse } from '@boi-hat/shared-types';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
};

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('boi_hat_access_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json();
    return json;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to connect to Boi-Hat API',
      },
    };
  }
}

