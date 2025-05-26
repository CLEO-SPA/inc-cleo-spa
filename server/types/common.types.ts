export interface HttpError extends Error {
  status?: number;
  errorCode?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
