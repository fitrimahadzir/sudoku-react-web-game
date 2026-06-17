export type ProviderType = 'TIKTOK_LIVE_CONNECTOR' | 'MOCK';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface NormalizedComment {
  uniqueId: string;
  nickname: string;
  comment: string;
  profilePictureUrl: string;
  timestamp: number;
}

export interface NormalizedGift {
  uniqueId: string;
  nickname: string;
  giftName: string;
  giftId: number;
  diamondCount: number;
  repeatCount: number;
  profilePictureUrl: string;
  timestamp: number;
}

export interface NormalizedLike {
  uniqueId: string;
  nickname: string;
  likeCount: number;
  profilePictureUrl: string;
  timestamp: number;
}

export interface ConnectionStatusEvent {
  status: ConnectionStatus;
  message?: string;
  provider?: ProviderType;
}

export type CommentCallback = (data: NormalizedComment) => void;
export type GiftCallback = (data: NormalizedGift) => void;
export type LikeCallback = (data: NormalizedLike) => void;
export type StatusCallback = (data: ConnectionStatusEvent) => void;
export type ErrorCallback = (error: string) => void;

export interface TikTokProvider {
  readonly type: ProviderType;
  connect(username: string): Promise<void>;
  disconnect(): void;
  onComment(callback: CommentCallback): void;
  onGift(callback: GiftCallback): void;
  onLike(callback: LikeCallback): void;
  onStatusChange(callback: StatusCallback): void;
  onError(callback: ErrorCallback): void;
  getStatus(): ConnectionStatus;
}
