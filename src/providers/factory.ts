import type { TikTokProvider, ProviderType } from './types';
import { TikTokLiveConnectorProvider } from './tiktok-live-connector-provider';
import { MockProvider } from './mock-provider';

export async function createProvider(
  type: ProviderType,
  username: string,
  onLog?: (msg: string) => void
): Promise<TikTokProvider> {
  const log = (msg: string) => {
    console.log(msg);
    onLog?.(msg);
  };

  const provider = buildProvider(type);
  log(`[Provider] Using ${type === 'TIKTOK_LIVE_CONNECTOR' ? 'TikTok Live Connector' : 'Mock'}`);
  await provider.connect(username);
  return provider;
}

function buildProvider(type: ProviderType): TikTokProvider {
  switch (type) {
    case 'TIKTOK_LIVE_CONNECTOR':
      return new TikTokLiveConnectorProvider();
    case 'MOCK':
      return new MockProvider();
  }
}
