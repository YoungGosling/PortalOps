// No specific model needed for GET invoice as it returns a file (Blob)
// The response is handled directly as a binary download

export interface GetInvoiceOptions {
  invoice_id: string;
}

