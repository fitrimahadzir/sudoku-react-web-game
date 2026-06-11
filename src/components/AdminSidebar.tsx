import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronDown, Loader2, LogIn, Shield, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase, type UserProfile, type UserRole } from '../lib/supabase';

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
  viewerLeaderboard: Record<string, { score: number; profilePictureUrl: string }>;
  authUser?: { id: string; email: string } | null;
  authProfile?: UserProfile | null;
  onShowAuth?: () => void;
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
  viewerLeaderboard,
  authUser,
  authProfile,
  onShowAuth,
}: AdminSidebarProps) {
  const leaderboardEntries = Object.entries(viewerLeaderboard)
    .map(([nickname, data]) => ({ nickname, score: data.score, profilePictureUrl: data.profilePictureUrl }))
    .sort((a, b) => b.score - a.score);

  const [tiktokExpanded, setTiktokExpanded] = useState(true);

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

                {authUser ? (
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{authUser.email}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{(authProfile?.role || 'basic').toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onShowAuth}
                    className="w-full flex items-center justify-center gap-2 bg-white/[0.03] border border-white/10 hover:border-blue-500/30 rounded-xl px-4 py-3 mb-4 text-xs font-bold text-slate-400 hover:text-white transition-all"
                  >
                    <LogIn className="w-4 h-4" /> Host Login
                  </button>
                )}

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-4">
                  <div className={cn("flex items-center gap-2", tiktokExpanded ? "mb-4" : "")}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">TikTok Live Connection</h3>
                    <button
                      onClick={() => setTiktokExpanded(prev => !prev)}
                      className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", tiktokExpanded && "rotate-180")} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {tiktokExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
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

                            {tiktokStatus === 'connecting' ? (
                              <div className="bg-blue-500/10 text-blue-400 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
                              </div>
                            ) : tiktokError ? (
                              <div className="bg-rose-500/10 text-rose-400 text-xs font-medium px-3 py-2 rounded-lg">
                                {tiktokError}
                              </div>
                            ) : null}

                            <button
                              type="submit"
                              disabled={tiktokStatus === 'connecting'}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              Connect
                            </button>
                          </form>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4 shadow-sm">
                  <h2 className="text-xs font-bold uppercase mb-3 flex items-center gap-2 text-slate-400 tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Leaderboard
                  </h2>

                  <div className="space-y-3">
                    {leaderboardEntries.length > 0 ? (
                      <>
                        {leaderboardEntries[0] && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gradient-to-br from-blue-900/30 to-[#0A1128] border border-blue-500/30 rounded-2xl p-4 shadow-md relative overflow-hidden mb-4"
                          >
                            <div className="flex flex-col items-center gap-2 relative z-10">
                              <img
                                src={leaderboardEntries[0].profilePictureUrl}
                                alt={leaderboardEntries[0].nickname}
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-400/50 ring-2 ring-blue-500/30 shadow-lg"
                              />
                              <div className="text-center">
                                <div className="text-sm font-black text-white truncate max-w-[150px]">@{leaderboardEntries[0].nickname}</div>
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">TOP PLAYER</div>
                              </div>
                              <div className="bg-white/10 text-white px-4 py-1 rounded-full text-sm font-black shadow-lg backdrop-blur-sm">
                                {leaderboardEntries[0].score.toLocaleString()} pts
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div className="space-y-1">
                          {leaderboardEntries.slice(1).map((entry, i) => {
                            const rank = i + 2;
                            return (
                              <motion.div
                                key={entry.nickname}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex justify-between items-center px-3 py-2 rounded-xl border border-transparent bg-transparent"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative shrink-0">
                                    <img
                                      src={entry.profilePictureUrl}
                                      alt={entry.nickname}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-[8px] font-black shadow-sm text-slate-300">
                                      {rank}
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold truncate text-slate-400">
                                    @{entry.nickname}
                                  </span>
                                </div>
                                <span className="text-xs font-black text-slate-500">{entry.score.toLocaleString()}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    ) : import.meta.env.VITE_DEV_MODE === 'true' ? (
                      <>
                        {mockLeaderboard[0] && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gradient-to-br from-blue-900/30 to-[#0A1128] border border-yellow-500/30 rounded-2xl p-4 shadow-md relative overflow-hidden mb-4"
                          >
                            <div className="absolute -right-4 -top-4 opacity-30 rotate-12">
                              <span className="text-5xl">👑</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 relative z-10">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-xl font-black border-2 border-yellow-400/50 ring-2 ring-yellow-500/30 shadow-lg">
                                {mockLeaderboard[0].avatar}
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-black text-white truncate max-w-[150px]">@{mockLeaderboard[0].username}</div>
                                <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mt-0.5">TOP PLAYER 👑</div>
                              </div>
                              <div className="bg-white/10 text-white px-4 py-1 rounded-full text-sm font-black shadow-lg backdrop-blur-sm">
                                {mockLeaderboard[0].score.toLocaleString()} pts
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div className="space-y-1">
                          {mockLeaderboard.slice(1).map((entry, i) => {
                            const rank = i + 2;
                            const isSilver = rank === 2;
                            const isBronze = rank === 3;
                            return (
                              <motion.div
                                key={entry.rank}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                  "flex justify-between items-center px-3 py-2 rounded-xl border transition-all",
                                  isSilver ? "bg-slate-700/30 border-slate-600/50" :
                                  isBronze ? "bg-orange-900/20 border-orange-700/30" :
                                  "bg-transparent border-transparent"
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative shrink-0">
                                    <div className={cn(
                                      "rounded-full flex items-center justify-center font-bold",
                                      isSilver || isBronze ? "w-8 h-8 text-xs" : "w-6 h-6 text-[8px]",
                                      isSilver ? "bg-slate-600 text-slate-200" :
                                      isBronze ? "bg-orange-800/50 text-orange-300" :
                                      "bg-slate-700 text-slate-400"
                                    )}>
                                      {entry.avatar}
                                    </div>
                                    <div className={cn(
                                      "absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-sm",
                                      isSilver ? "bg-slate-500 text-white" :
                                      isBronze ? "bg-orange-500 text-white" :
                                      "bg-slate-600 text-slate-300"
                                    )}>
                                      {rank}
                                    </div>
                                  </div>
                                  <span className={cn(
                                    "font-bold truncate",
                                    isSilver ? "text-sm text-slate-200" :
                                    isBronze ? "text-sm text-slate-300" :
                                    "text-xs text-slate-400"
                                  )}>
                                    @{entry.username}
                                    {isSilver && " 🥈"}
                                    {isBronze && " 🥉"}
                                  </span>
                                </div>
                                <span className={cn(
                                  "font-black",
                                  isSilver ? "text-slate-400 text-sm" :
                                  isBronze ? "text-orange-400 text-sm" :
                                  "text-slate-500 text-xs"
                                )}>{entry.score.toLocaleString()}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-slate-800/30 border-2 border-slate-700/50 border-dashed rounded-2xl p-4 animate-pulse mb-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-slate-700/50 border-2 border-slate-600/50 ring-2 ring-slate-700/30" />
                            <div className="h-3 w-24 bg-slate-700/50 rounded mt-2" />
                            <div className="h-2 w-32 bg-slate-700/30 rounded" />
                            <div className="h-7 w-28 bg-slate-700/50 rounded-full mt-1" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          {[1, 2].map((i) => (
                            <div key={i} className="flex justify-between items-center px-3 py-2 rounded-xl border border-slate-700/30 bg-slate-800/20 animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700/50" />
                                <div className="h-2 w-20 bg-slate-700/50 rounded" />
                              </div>
                              <div className="h-2 w-8 bg-slate-700/50 rounded" />
                            </div>
                          ))}
                          <div className="text-center py-4 opacity-30 italic text-[10px] text-slate-500">
                            Waiting for first player...
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
