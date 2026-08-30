export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}