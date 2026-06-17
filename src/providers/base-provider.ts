import type { TikTokProvider, ProviderType, ConnectionStatus, CommentCallback, GiftCallback, LikeCallback, StatusCallback, ErrorCallback } from './types';

export abstract class BaseProvider implements TikTokProvider {
  abstract readonly type: ProviderType;

  protected status: ConnectionStatus = 'disconnected';
  protected commentCallbacks: CommentCallback[] = [];
  protected giftCallbacks: GiftCallback[] = [];
  protected likeCallbacks: LikeCallback[] = [];
  protected statusCallbacks: StatusCallback[] = [];
  protected errorCallbacks: ErrorCallback[] = [];

  abstract connect(username: string): Promise<void>;
  abstract disconnect(): void;

  onComment(callback: CommentCallback): void {
    this.commentCallbacks.push(callback);
  }

  onGift(callback: GiftCallback): void {
    this.giftCallbacks.push(callback);
  }

  onLike(callback: LikeCallback): void {
    this.likeCallbacks.push(callback);
  }

  onStatusChange(callback: StatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  protected setStatus(status: ConnectionStatus, message?: string): void {
    this.status = status;
    const event = { status, message, provider: this.type };
    for (const cb of this.statusCallbacks) {
      cb(event);
    }
    console.log(`[Provider][${this.type}] ${status}${message ? `: ${message}` : ''}`);
  }

  protected emitComment(data: Parameters<CommentCallback>[0]): void {
    for (const cb of this.commentCallbacks) {
      cb(data);
    }
  }

  protected emitGift(data: Parameters<GiftCallback>[0]): void {
    for (const cb of this.giftCallbacks) {
      cb(data);
    }
  }

  protected emitLike(data: Parameters<LikeCallback>[0]): void {
    for (const cb of this.likeCallbacks) {
      cb(data);
    }
  }

  protected emitError(error: string): void {
    for (const cb of this.errorCallbacks) {
      cb(error);
    }
  }
}
