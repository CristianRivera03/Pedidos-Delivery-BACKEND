export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiErrorDetail {
  type: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: ApiErrorDetail;
  timestamp: string;
  path: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
