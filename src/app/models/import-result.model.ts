export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}
