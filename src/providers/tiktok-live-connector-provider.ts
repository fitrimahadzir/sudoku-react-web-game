import { WebcastPushConnection } from 'tiktok-live-connector';
import { BaseProvider } from './base-provider';
import type { ProviderType } from './types';

export class TikTokLiveConnectorProvider extends BaseProvider {
  readonly type: ProviderType = 'TIKTOK_LIVE_CONNECTOR';
  private connection: WebcastPushConnection | null = null;
  private username = '';

  async connect(username: string): Promise<void> {
    this.username = username;
    this.setStatus('connecting', `Connecting to TikTok Live for ${username}`);

    try {
      this.disconnect();

      const signApiKey = process.env.TIKTOK_SIGN_API_KEY || undefined;
      const sessionId = process.env.TIKTOK_SESSION_ID || undefined;

      const options: Record<string, any> = {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        requestPollingIntervalMs: 2000,
        disableEulerFallbacks: true,
        clientParams: {
          app_language: 'en-US',
          device_platform: 'web',
        },
      };

      if (sessionId) {
        options.sessionId = sessionId;
        options.authenticateWs = true;
      }

      if (signApiKey) {
        options.signApiKey = signApiKey;
      }

      const tiktokLiveConnection = new WebcastPushConnection(username, options);

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
        console.error(`[TikTokLiveConnector] Error:`, err);
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
      const hints: string[] = [];
      if (process.env.TIKTOK_SESSION_ID) {
        hints.push('TIKTOK_SESSION_ID may be invalid or expired');
      } else {
        hints.push('Set TIKTOK_SESSION_ID (TikTok session cookie) for free self-hosted connection');
      }
      hints.push('Or set TIKTOK_SIGN_API_KEY from https://www.eulerstream.com');
      const msg = `TikTok Live: ${detail}. ${hints.join('; ')}`;
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
