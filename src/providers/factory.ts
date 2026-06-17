import type { TikTokProvider, ProviderType } from './types';
import { EulerStreamProvider } from './eulerstream-provider';
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

  const resolvedType = resolveProviderType(type);
  const label = resolvedType === 'EULERSTREAM' ? 'EulerStream' : resolvedType === 'TIKTOK_LIVE_CONNECTOR' ? 'TikTok Live Connector' : 'Mock';

  log(`[Provider] Using ${label}`);

  const provider = buildProvider(resolvedType);
  await provider.connect(username);
  return provider;
}

function resolveProviderType(type: ProviderType): Exclude<ProviderType, 'AUTO'> {
  if (type !== 'AUTO') return type;
  return process.env.TIKTOK_SIGN_API_KEY ? 'EULERSTREAM' : 'TIKTOK_LIVE_CONNECTOR';
}

function buildProvider(type: Exclude<ProviderType, 'AUTO'>): TikTokProvider {
  switch (type) {
    case 'EULERSTREAM':
      return new EulerStreamProvider();
    case 'TIKTOK_LIVE_CONNECTOR':
      return new TikTokLiveConnectorProvider();
    case 'MOCK':
      return new MockProvider();
  }
}
