/**
 * Remon Download Web — API Client
 *
 * Central HTTP client for all Frontend ↔ Backend REST API communication.
 * Components must NOT use fetch() directly — use this layer instead.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorPayload: ApiError = {
        code: 'REQUEST_FAILED',
        message: `Request failed with status ${response.status}`,
      };
      try {
        const json = await response.json();
        if (json.error) errorPayload = json.error;
      } catch {
        // Ignore JSON parse errors on error responses
      }
      throw errorPayload;
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
