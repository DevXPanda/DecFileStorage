export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  cid: string;
  created_at: string;
  user_id: string;
  wallet_address: string;
  uploadedAt: Date;
}

export interface DatabaseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  cid: string;
  uploaded_at?: string;
  user_id: string;
  wallet_address: string;
} 