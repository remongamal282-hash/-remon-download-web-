import { ApiSuccessResponse } from '../types';

export function successResponse<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}