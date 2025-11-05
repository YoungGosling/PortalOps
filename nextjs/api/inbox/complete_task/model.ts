// Path parameter
export interface CompleteTaskParams {
  task_id: string;
}

// Request body (optional for offboarding partial removal)
export interface CompleteTaskRequest {
  product_ids_to_remove?: string[];
}

// Response is 204 No Content






