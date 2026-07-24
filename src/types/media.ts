export interface MediaItem {
  id: string;
  url: string;
  originalName: string;
  title: string;
  altText: string;
  mimeType: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  sourceContext: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaSource {
  value: string;
  total: number;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  limit: number;
  sources: MediaSource[];
}
