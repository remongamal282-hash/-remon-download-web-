export type MetadataType = 'video' | 'playlist';

export interface MetadataFormat {
  formatId: string;
  type: 'video' | 'audio';
  container: string | null;
  quality: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  filesize: number | null;
}

export interface MetadataChannel {
  id: string | null;
  name: string | null;
  url: string | null;
}

export interface VideoMetadata {
  type: 'video';
  platform: 'youtube';
  id: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: number | null;
  channel: MetadataChannel;
  viewCount: number | null;
  uploadDate: string | null;
  formats: MetadataFormat[];
}

export interface PlaylistMetadata {
  type: 'playlist';
  platform: 'youtube';
  id: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  itemCount: number;
  items: Array<Pick<VideoMetadata, 'id' | 'url' | 'title' | 'thumbnail' | 'duration'>>;
}

export type NormalizedMetadata = VideoMetadata | PlaylistMetadata;