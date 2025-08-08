export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  length?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  totalItems?: number;
  timestamp: string;
  path?: string;
  method?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class ResponseHelper {
  /**
   * Creates a successful response
   */
  static success<T>(
    message = 'Operation completed successfully',
    data: T,
    path?: string,
    method?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      length: Array.isArray(data) ? data.length : (data && Array.isArray((data as any).data) ? (data as any).data.length : undefined),
      data,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a successful response for single items
   */
  static successSingle<T>(
    data: T,
    message = 'Item retrieved successfully',
    path?: string,
    method?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a successful response for created items
   */
  static created<T>(
    data: T,
    message = 'Item created successfully',
    path?: string,
    method?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a successful response for updated items
   */
  static updated<T>(
    data: T,
    message = 'Item updated successfully',
    path?: string,
    method?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a successful response for deleted items
   */
  static deleted(
    message = 'Item deleted successfully',
    path?: string,
    method?: string,
  ): ApiResponse<null> {
    return {
      success: true,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    totalItems: number,
    message = 'Items retrieved successfully',
    path?: string,
    method?: string,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      message,
      data,
      length: data.length,
      page,
      limit,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates an error response
   */
  static error(
    message: string,
    path?: string,
    method?: string,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a not found response
   */
  static notFound(
    message = 'Item not found',
    path?: string,
    method?: string,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a validation error response
   */
  static validationError(
    message = 'Validation failed',
    path?: string,
    method?: string,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }

  /**
   * Creates a conflict error response
   */
  static conflict(
    message = 'Resource conflict',
    path?: string,
    method?: string,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path,
      method,
    };
  }
}
