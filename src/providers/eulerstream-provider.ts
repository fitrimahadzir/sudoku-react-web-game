import { WebcastPushConnection } from 'tiktok-live-connector';
import { BaseProvider } from './base-provider';
import type { ProviderType } from './types';

export class EulerStreamProvider extends BaseProvider {
  readonly type: ProviderType = 'EULERSTREAM';
  private connection: WebcastPushConnection | null = null;
  private username = '';

  async connect(username: string): Promise<void> {
    this.username = username;
    this.setStatus('connecting', `Connecting to TikTok Live for ${username}`);

    try {
      this.disconnect();

      const signApiKey = process.env.TIKTOK_SIGN_API_KEY;
      const tiktokLiveConnection = new WebcastPushConnection(username, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        requestPollingIntervalMs: 2000,
        ...(signApiKey ? { signApiKey } : {}),
        clientParams: {
          app_language: 'en-US',
          device_platform: 'web',
        },
      });

      this.connection = tiktokLiveConnection;

      tiktokLiveConnection.on('chat', (data) => {
        this.emitComment({
          uniqueId: data.uniqueId,
          nickname: data.nickname,
          comment: data.comment,
          profilePictureUrl: data.profilePictureUrl || '',
          timestamp: Date.now(),
        });
      });

      tiktokLiveConnection.on('gift', (data) => {
        this.emitGift({
          uniqueId: data.uniqueId,
          nickname: data.nickname,
          giftName: data.giftName || 'Gift',
          giftId: data.giftId || 0,
          diamondCount: data.diamondCount || 0,
          repeatCount: data.repeatCount || 1,
          profilePictureUrl: data.profilePictureUrl || '',
          timestamp: Date.now(),
        });
      });

      tiktokLiveConnection.on('like', (data) => {
        this.emitLike({
          uniqueId: data.uniqueId,
          nickname: data.nickname,
          likeCount: data.likeCount || 0,
          profilePictureUrl: data.profilePictureUrl || '',
          timestamp: Date.now(),
        });
      });

      tiktokLiveConnection.on('error', (err) => {
        const msg = err.message || 'Unknown TikTok error';
        console.error(`[EulerStream] Error:`, err);
        this.emitError(msg);
      });

      tiktokLiveConnection.on('streamEnd', () => {
        this.setStatus('disconnected', 'Stream ended');
        this.connection = null;
      });

      tiktokLiveConnection.on('disconnected', () => {
        this.setStatus('disconnected', 'Disconnected from TikTok Live');
        this.connection = null;
      });

      const state = await tiktokLiveConnection.connect();
      this.setStatus('connected', `Connected to room ${state.roomId}`);
    } catch (err: any) {
      this.connection = null;
      const raw = err.message || '';
      const body = raw.match(/"([^"]+)"/);
      const detail = body ? body[1] : raw;
      const msg = `EulerStream: ${detail}. Get a new key at https://www.eulerstream.com`;
      this.setStatus('error', msg);
      this.emitError(msg);
      throw new Error(msg);
    }
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
    this.setStatus('disconnected', 'Manually disconnected');
  }
}
