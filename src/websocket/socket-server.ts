import { Server as SocketIOServer, Socket } from 'socket.io';
import type { TikTokProvider, ProviderType, ConnectionStatusEvent, NormalizedComment, NormalizedGift, NormalizedLike } from '../providers/types';
import { createProvider } from '../providers/factory';

interface ActiveConnection {
  provider: TikTokProvider;
  username: string;
}

export class SocketServer {
  private io: SocketIOServer;
  private activeConnections = new Map<string, ActiveConnection>();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  attach(socket: Socket): void {
    let currentUsername = '';
    let currentProvider: TikTokProvider | null = null;

    const cleanup = () => {
      if (currentProvider) {
        currentProvider.disconnect();
        if (currentUsername) {
          this.activeConnections.delete(currentUsername);
        }
        currentProvider = null;
        currentUsername = '';
      }
    };

    socket.on('connect_tiktok', async (username: string) => {
      console.log(`[SocketServer] Client ${socket.id} connecting to TikTok: ${username}`);

      cleanup();
      currentUsername = username;

      const providerType = (process.env.TIKTOK_PROVIDER?.toUpperCase() || 'AUTO') as ProviderType;
      socket.emit('connection_status', { status: 'connecting', provider: providerType });

      try {
        const provider = await createProvider(providerType, username, (logMsg) => {
          console.log(logMsg);
        });

        currentProvider = provider;
        this.activeConnections.set(username, { provider, username });

        provider.onStatusChange((event: ConnectionStatusEvent) => {
          socket.emit('connection_status', event);
          if (event.status === 'disconnected' || event.status === 'error') {
            this.activeConnections.delete(username);
          }
        });

        provider.onComment((data: NormalizedComment) => {
          socket.emit('comment', data);
        });

        provider.onGift((data: NormalizedGift) => {
          socket.emit('gift', data);
        });

        provider.onLike((data: NormalizedLike) => {
          socket.emit('like', data);
        });

        provider.onError((error: string) => {
          socket.emit('connection_status', { status: 'error', message: error, provider: provider.type });
        });

        socket.emit('connection_status', {
          status: 'connected',
          message: `Connected via ${provider.type}`,
          provider: provider.type,
        });
      } catch (err: any) {
        console.error(`[SocketServer] All providers failed:`, err);
        socket.emit('connection_status', {
          status: 'error',
          message: err.message || 'Failed to connect',
        });
      }
    });

    socket.on('disconnect_tiktok', () => {
      cleanup();
      socket.emit('connection_status', { status: 'disconnected', message: 'Manually disconnected' });
    });

    socket.on('disconnect', () => {
      cleanup();
    });
  }
}
