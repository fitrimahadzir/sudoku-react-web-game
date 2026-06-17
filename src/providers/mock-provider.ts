import { BaseProvider } from './base-provider';
import type { ProviderType } from './types';

const fakeUsernames = [
  'SudokuMaster', 'PuzzleKing', 'BrainWave', 'NumberNinja',
  'GridGuru', 'LogicLord', 'CellSage', 'RowRunner',
];

const fakeComments = [
  'A1 5', 'B2 3', 'C3 7', 'D4 9', 'E5 1',
  'F6 4', 'G7 2', 'H8 8', 'I9 6',
  'A3 2', 'B5 7', 'C7 9',
];

export class MockProvider extends BaseProvider {
  readonly type: ProviderType = 'MOCK';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private username = '';

  async connect(username: string): Promise<void> {
    this.username = username;
    this.setStatus('connecting', 'Starting mock provider');

    await new Promise((resolve) => setTimeout(resolve, 500));

    this.setStatus('connected', 'Mock provider active');

    let index = 0;
    this.intervalId = setInterval(() => {
      const fakeUser = fakeUsernames[Math.floor(Math.random() * fakeUsernames.length)];
      const comment = fakeComments[index % fakeComments.length];
      index++;

      this.emitComment({
        uniqueId: fakeUser.toLowerCase(),
        nickname: fakeUser,
        comment,
        profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fakeUser}`,
        timestamp: Date.now(),
      });

      if (Math.random() > 0.7) {
        this.emitGift({
          uniqueId: fakeUser.toLowerCase(),
          nickname: fakeUser,
          giftName: 'Rose',
          giftId: 1,
          diamondCount: 1,
          repeatCount: 1,
          profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fakeUser}`,
          timestamp: Date.now(),
        });
      }

      if (Math.random() > 0.85) {
        this.emitLike({
          uniqueId: fakeUser.toLowerCase(),
          nickname: fakeUser,
          likeCount: Math.floor(Math.random() * 10) + 1,
          profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fakeUser}`,
          timestamp: Date.now(),
        });
      }
    }, 3000);
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.setStatus('disconnected', 'Mock provider stopped');
  }
}
