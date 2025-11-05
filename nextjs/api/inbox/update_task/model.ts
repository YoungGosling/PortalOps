// Request body for updating a task
export interface UpdateTaskRequest {
  status?: string;
  comment?: string;
  attachment_path?: string;
}

// Path parameter
export interface UpdateTaskParams {
  task_id: string;
}






