// Base interface for common fields across all collections
export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
