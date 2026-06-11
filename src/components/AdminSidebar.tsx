import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Loader2, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

const mockLeaderboard: { rank: number; username: string; avatar: string; score: number }[] = [
  { rank: 1, username: 'SudokuMaster', avatar: 'SM', score: 9850 },
  { rank: 2, username: 'PuzzleKing', avatar: 'PK', score: 9200 },
  { rank: 3, username: 'BrainWave', avatar: 'BW', score: 8700 },
  { rank: 4, username: 'NumberNinja', avatar: 'NN', score: 8100 },
  { rank: 5, username: 'GridGuru', avatar: 'GG', score: 7650 },
  { rank: 6, username: 'LogicLord', avatar: 'LL', score: 7200 },
  { rank: 7, username: 'CellSage', avatar: 'CS', score: 6800 },
  { rank: 8, username: 'RowRunner', avatar: 'RR', score: 6400 },
  { rank: 9, username: 'BoxBoss', avatar: 'BB', score: 6100 },
  { rank: 10, username: 'DigitDuke', avatar: 'DD', score: 5900 },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  tiktokUsername: string;
  onTiktokUsernameChange: (value: string) => void;
  tiktokStatus: 'disconnected' | 'connecting' | 'connected';
  tiktokError: string;
  onConnectTikTok: (e: React.FormEvent) => void;
  onDisconnectTikTok: () => void;
  socketId?: string;
}

export default function AdminSidebar({
  isOpen,
  onClose,
  onOpen,
  tiktokUsername,
  onTiktokUsernameChange,
  tiktokStatus,
  tiktokError,
  onConnectTikTok,
  onDisconnectTikTok,
  socketId,
}: AdminSidebarProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed right-0 top-16 z-50 w-7 h-24 bg-[#0A1128]/80 backdrop-blur-md border border-white/10 border-r-0 rounded-l-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-[#0A1128] hover:border-blue-400/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all cursor-pointer group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className={cn(
                "fixed right-0 top-0 h-full z-50 bg-[#0A1128]/90 backdrop-blur-xl border-l border-blue-500/20 shadow-[-4px_0_30px_rgba(0,0,0,0.5)] overflow-y-auto",
                "w-[90vw] sm:w-[300px] lg:w-[320px]"
              )}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 pt-14">
                <div className="flex justify-center mb-8">
                  <img
                    src="/images/logo-admin.svg"
                    alt="Sadoku"
                    className="h-12 object-contain"
                  />
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">TikTok Live Connection</h3>
                  </div>

                  {tiktokStatus === 'connected' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                        <span className="text-sm text-emerald-300 font-medium">@{tiktokUsername}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Connected
                        </span>
                      </div>
                      {socketId && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Session: {socketId}
                        </div>
                      )}
                      <button
                        onClick={onDisconnectTikTok}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={onConnectTikTok} className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">@</span>
                        <input
                          type="text"
                          value={tiktokUsername}
                          onChange={(e) => onTiktokUsernameChange(e.target.value.replace('@', ''))}
                          placeholder="username"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-8 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        />
                      </div>

                      {tiktokError && (
                        <div className="bg-rose-500/10 text-rose-400 text-xs font-medium px-3 py-2 rounded-lg">
                          {tiktokError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={tiktokStatus === 'connecting'}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {tiktokStatus === 'connecting' ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
                        ) : (
                          'Connect'
                        )}
                      </button>
                    </form>
                  )}
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Leaderboard</h3>
                  </div>

                  {mockLeaderboard.length > 0 ? (
                    <div className="space-y-0.5">
                      {mockLeaderboard.map((entry) => {
                        const isTop3 = entry.rank <= 3;
                        const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
                        return (
                          <div
                            key={entry.rank}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all",
                              isTop3 ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                            )}
                          >
                            <span className={cn(
                              "w-5 text-center text-xs font-bold font-mono",
                              isTop3 ? rankColors[entry.rank - 1] : "text-slate-600"
                            )}>
                              {entry.rank}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                              {entry.avatar}
                            </div>
                            <span className="flex-1 text-sm text-slate-300 font-medium truncate">
                              {entry.username}
                            </span>
                            <span className="text-xs font-bold font-mono text-slate-400">
                              {entry.score.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-4">Waiting for first player...</p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
