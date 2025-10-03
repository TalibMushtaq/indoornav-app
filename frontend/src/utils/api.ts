// src/utils/api.ts

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

/**
 * Basic API call without authentication
 */
export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
};

/**
 * API call with authentication token
 */
export const apiCallWithAuth = async (
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...options?.headers,
    Authorization: `Bearer ${token}`,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * POST request without authentication
 */
export const apiPost = async (endpoint: string, data: any): Promise<Response> => {
  return apiCall(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

/**
 * PUT request with authentication
 */
export const apiPut = async (
  endpoint: string,
  token: string,
  data: any
): Promise<Response> => {
  return apiCallWithAuth(endpoint, token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request with authentication
 */
export const apiDelete = async (
  endpoint: string,
  token: string
): Promise<Response> => {
  return apiCallWithAuth(endpoint, token, {
    method: 'DELETE',
  });
};