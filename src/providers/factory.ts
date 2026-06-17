import type { TikTokProvider, ProviderType } from './types';
import { EulerStreamProvider } from './eulerstream-provider';
import { TikTokLiveConnectorProvider } from './tiktok-live-connector-provider';
import { MockProvider } from './mock-provider';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createProvider(
  type: ProviderType,
  username: string,
  onLog?: (msg: string) => void
): Promise<TikTokProvider> {
  const log = (msg: string) => {
    console.log(msg);
    onLog?.(msg);
  };

  if (type !== 'AUTO') {
    const provider = buildProvider(type);
    await provider.connect(username);
    return provider;
  }

  // AUTO: try EulerStream first, then TikTok Live Connector, then Mock
  const euler = new EulerStreamProvider();
  try {
    log('[Provider] Trying EulerStream...');
    await euler.connect(username);
    log('[Provider] EulerStream Connected');
    return euler;
  } catch (eulerErr: any) {
    log(`[Provider] EulerStream Failed: ${eulerErr.message}`);
    euler.disconnect();
  }

  await sleep(500);

  const tlc = new TikTokLiveConnectorProvider();
  try {
    log('[Provider] Switching To TikTok Live Connector...');
    await tlc.connect(username);
    log('[Provider] TikTok Live Connector Connected');
    return tlc;
  } catch (tlcErr: any) {
    log(`[Provider] TikTok Live Connector Failed: ${tlcErr.message}`);
    tlc.disconnect();
  }

  throw new Error('All TikTok providers failed. Set TIKTOK_PROVIDER=MOCK to use mock mode.');
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
