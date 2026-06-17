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

  // AUTO: try EulerStream if key exists, fall back to TLC on failure
  if (process.env.TIKTOK_SIGN_API_KEY) {
    try {
      log('[Provider] Trying EulerStream...');
      const euler = new EulerStreamProvider();
      await euler.connect(username);
      log('[Provider] EulerStream Connected');
      return euler;
    } catch (eulerErr: any) {
      log(`[Provider] EulerStream Failed: ${eulerErr.message}`);
    }
    await sleep(500);
  }

  log('[Provider] Using TikTok Live Connector');
  const tlc = new TikTokLiveConnectorProvider();
  await tlc.connect(username);
  return tlc;
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
