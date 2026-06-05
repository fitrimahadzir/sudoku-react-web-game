import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateSudokuBoard, SudokuBoardState, SudokuCell, checkCompletion, Difficulty } from '../lib/sudoku';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { DEBUG_MODE } from '../constants';
import { Loader2, CheckCircle2, RotateCcw, Eraser, Camera, Undo2, Delete, Lightbulb, CircleDot, ChevronLeft, Pencil, LayoutGrid, LayoutList, Lock, Unlock, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';

interface SudokuGameProps {
  difficulty: Difficulty;
  onBack: () => void;
}

export default function SudokuGame({ difficulty, onBack }: SudokuGameProps) {
  const [boardState, setBoardState] = useState<SudokuBoardState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [history, setHistory] = useState<{ grid: any[][]; mistakes: number }[]>([]);
  const [conflictingCells, setConflictingCells] = useState<{ r: number; c: number }[]>([]);
  const [layoutMode, setLayoutMode] = useState<'standard' | 'dashboard'>('standard');
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const isLayoutLockedRef = useRef(isLayoutLocked);

  // TikTok Live States
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [isTiktokModalOpen, setIsTiktokModalOpen] = useState(false);
  const [tiktokStatus, setTiktokStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [tiktokError, setTiktokError] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const mistakeLimit = tiktokStatus === 'connected' ? Infinity : 5;

  useEffect(() => {
    isLayoutLockedRef.current = isLayoutLocked;
  }, [isLayoutLocked]);

  useEffect(() => {
    // Set default mode based on screen size on mount
    const checkScreenSize = () => {
      if (isLayoutLockedRef.current) return;
      if (window.innerWidth >= 1024) { // lg breakpoint in tailwind
        setLayoutMode('dashboard');
      } else {
        setLayoutMode('standard');
      }
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchBoard = useCallback(() => {
    setIsLoading(true);
    setIsCompleted(false);
    setHasStarted(false);
    setSelectedCell(null);
    setMistakes(0);
    setElapsedTime(0);
    setHintsRemaining(difficulty === 'sado' ? 0 : 3);
    setHistory([]);
    
    // Slight delay to allow UI to update loading state
    setTimeout(() => {
        try {
          const newBoard = generateSudokuBoard(difficulty);
          setBoardState(newBoard);
        } catch (error) {
          console.error("Failed to generate board", error);
        } finally {
          setIsLoading(false);
        }
    }, 50);
  }, [difficulty]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    if (isLoading || isCompleted || !hasStarted || (difficulty !== 'sado' && mistakes >= mistakeLimit)) return;
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, isCompleted, hasStarted, mistakes, difficulty]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCellClick = (r: number, c: number) => {
    if (isCompleted || !boardState || (difficulty !== 'sado' && mistakes >= mistakeLimit)) return;
    setSelectedCell({ r, c });
  };

  const applyInput = useCallback((r: number, c: number, value: number, forceValueMode = false, source: 'user' | 'tiktok' = 'user') => {
    if (!boardState || isCompleted || (difficulty !== 'sado' && mistakes >= mistakeLimit)) return;
    const cell = boardState.grid[r][c];

    if (cell.isInitial) return;

    if (!hasStarted && value !== 0) {
      setHasStarted(true);
    }

    // Save state for undo
    setHistory(prev => {
      const newHistory = [...prev, { grid: JSON.parse(JSON.stringify(boardState.grid)), mistakes }];
      if (newHistory.length > 20) newHistory.shift(); // Limit history to 20 steps
      return newHistory;
    });

    const newGrid = boardState.grid.map(row => [...row]);
    
    const isNotes = !forceValueMode && isNotesMode;

    // Check validation (Disabled for 'sado' difficulty)
    if (difficulty !== 'sado' && value !== 0) {
      // Find conflicts: cannot have a value/note that matches an existing value in row, col, or block
      const conflicts: { r: number; c: number }[] = [];
      const blockStartR = Math.floor(r / 3) * 3;
      const blockStartC = Math.floor(c / 3) * 3;

      for (let i = 0; i < 9; i++) {
        // Row conflict
        if (i !== c && boardState.grid[r][i].value === value) {
          conflicts.push({ r, c: i });
        }
        // Column conflict
        if (i !== r && boardState.grid[i][c].value === value) {
          conflicts.push({ r: i, c });
        }
        // Block conflict
        const br = blockStartR + Math.floor(i / 3);
        const bc = blockStartC + (i % 3);
        if ((br !== r || bc !== c) && boardState.grid[br][bc].value === value) {
          conflicts.push({ r: br, c: bc });
        }
      }

      if (conflicts.length > 0) {
        setConflictingCells(conflicts);
        setTimeout(() => setConflictingCells([]), 600);
        if (!isNotes) {
          setMistakes(m => m + 1);
        }
        return; // Reject the move/note
      }
    }

    if (isNotes && value !== 0) {
      const newNotes = cell.notes?.includes(value)
        ? cell.notes.filter(n => n !== value)
        : [...(cell.notes || []), value].sort();
        
      newGrid[r][c] = {
        ...cell,
        notes: newNotes,
      };
      setBoardState({ ...boardState, grid: newGrid });
      return;
    }

    const isError = difficulty === 'sado' ? false : value !== 0 && value !== cell.solutionValue;
    
    newGrid[r][c] = {
      ...cell,
      value,
      isError,
      source: value === 0 ? undefined : source,
      notes: [], // Always clear notes when setting a value or erasing
    };

    // Prune notes if the value is correct
    if (value !== 0 && !isError) {
      const blockR = Math.floor(r / 3) * 3;
      const blockC = Math.floor(c / 3) * 3;
      
      for (let i = 0; i < 9; i++) {
        // Row
        if (i !== c) {
          newGrid[r][i] = { ...newGrid[r][i], notes: newGrid[r][i].notes?.filter(n => n !== value) || [] };
        }
        // Column
        if (i !== r) {
          newGrid[i][c] = { ...newGrid[i][c], notes: newGrid[i][c].notes?.filter(n => n !== value) || [] };
        }
        // Block
        const br = blockR + Math.floor(i / 3);
        const bc = blockC + (i % 3);
        if (br !== r || bc !== c) {
          newGrid[br][bc] = { ...newGrid[br][bc], notes: newGrid[br][bc].notes?.filter(n => n !== value) || [] };
        }
      }
    }

    if (isError) {
      setMistakes(m => m + 1);
    }

    setBoardState({ ...boardState, grid: newGrid });

    if (checkCompletion(newGrid)) {
      setIsCompleted(true);
    }
  }, [boardState, isCompleted, isNotesMode, mistakes, difficulty, hasStarted]);

  const handleInput = useCallback((value: number) => {
    if (!selectedCell) return;
    applyInput(selectedCell.r, selectedCell.c, value);
  }, [selectedCell, applyInput]);

  useEffect(() => {
    // Only connect socket if we don't have one
    if (!socketRef.current) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      socketRef.current = io(backendUrl);
    }

    const socket = socketRef.current;

    const handleChat = (data: { nickname: string, comment: string }) => {
      const match = data.comment.match(/^\s*([a-iA-I])([1-9])\s*([1-9])\s*$/);
      if (match) {
        const c = match[1].toUpperCase().charCodeAt(0) - 65; 
        const r = parseInt(match[2], 10) - 1; 
        const value = parseInt(match[3], 10);
        applyInput(r, c, value, true, 'tiktok'); // force value input
      }
    };

    const handleConnected = () => {
      setTiktokStatus("connected");
      setTiktokError("");
    };

    const handleDisconnected = (reason: string) => {
      setTiktokStatus("disconnected");
      setTiktokError(reason);
    };

    const handleError = (error: string) => {
      setTiktokStatus("disconnected");
      setTiktokError(error);
    };

    socket.on('tiktok_chat', handleChat);
    socket.on('tiktok_connected', handleConnected);
    socket.on('tiktok_disconnected', handleDisconnected);
    socket.on('tiktok_error', handleError);

    return () => {
      socket.off('tiktok_chat', handleChat);
      socket.off('tiktok_connected', handleConnected);
      socket.off('tiktok_disconnected', handleDisconnected);
      socket.off('tiktok_error', handleError);
    };
  }, [applyInput]);

  const connectTikTok = (e: React.FormEvent) => {
    e.preventDefault();
    if (tiktokUsername.trim() && socketRef.current) {
      setTiktokStatus("connecting");
      socketRef.current.emit("connect_tiktok", tiktokUsername.trim());
      setIsTiktokModalOpen(false);
    }
  };

  const disconnectTikTok = () => {
    if (socketRef.current) {
      socketRef.current.emit("disconnect_tiktok");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isCompleted || (difficulty !== 'sado' && mistakes >= mistakeLimit) || !boardState) return;
      
      const { r, c } = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleInput(0);
      } else if (e.key === 'ArrowUp') {
        setSelectedCell({ r: Math.max(0, r - 1), c });
      } else if (e.key === 'ArrowDown') {
        setSelectedCell({ r: Math.min(8, r + 1), c });
      } else if (e.key === 'ArrowLeft') {
        setSelectedCell({ r, c: Math.max(0, c - 1) });
      } else if (e.key === 'ArrowRight') {
        setSelectedCell({ r, c: Math.min(8, c + 1) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, selectedCell, isCompleted, boardState, difficulty, mistakes]);

  const resetBoard = useCallback(() => {
    if (!boardState) return;
    const newGrid = boardState.grid.map(row => 
      row.map(cell => (cell.isInitial ? cell : { ...cell, value: 0, isError: false, notes: [] }))
    );
    setBoardState({ ...boardState, grid: newGrid });
    setMistakes(0);
    setIsCompleted(false);
    setHistory([]);
  }, [boardState]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || !boardState || isCompleted) return;

    const lastState = history[history.length - 1];
    setBoardState({ ...boardState, grid: lastState.grid });
    setMistakes(lastState.mistakes);
    setHistory(prev => prev.slice(0, -1));
  }, [history, boardState, isCompleted]);

  useEffect(() => {
    if (isCompleted) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1D4ED8', '#5A8DF3', '#F0F4FA']
      });
    }
  }, [isCompleted]);

  const handleAutoWin = useCallback(() => {
    if (!boardState) return;
    const newGrid = boardState.grid.map(row => 
      row.map(cell => ({
        ...cell,
        value: cell.solutionValue,
        isError: false,
        notes: []
      }))
    );
    setBoardState({ ...boardState, grid: newGrid });
    setIsCompleted(true);
  }, [boardState]);

  const handleHint = useCallback(() => {
    if (hintsRemaining <= 0 || !boardState || isCompleted || (difficulty !== 'sado' && mistakes >= mistakeLimit)) return;

    let targetR = -1;
    let targetC = -1;

    if (selectedCell) {
      const [r, c] = [selectedCell.r, selectedCell.c];
      const cell = boardState.grid[r][c];
      if (cell.value === 0 || cell.isError) {
        targetR = r;
        targetC = c;
      }
    }

    if (targetR === -1) {
      const emptyCells: [number, number][] = [];
      boardState.grid.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell.value === 0 || cell.isError) {
            emptyCells.push([ri, ci]);
          }
        });
      });

      if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const [r, c] = emptyCells[randomIndex];
        targetR = r;
        targetC = c;
      }
    }

    if (targetR !== -1 && targetC !== -1) {
      if (!hasStarted) {
        setHasStarted(true);
      }
      // Save state for undo
      setHistory(prev => {
        const newHistory = [...prev, { grid: JSON.parse(JSON.stringify(boardState.grid)), mistakes }];
        if (newHistory.length > 20) newHistory.shift();
        return newHistory;
      });

      const newGrid = boardState.grid.map(row => [...row]);
      
      const cell = newGrid[targetR][targetC];
      const value = cell.solutionValue;
      newGrid[targetR][targetC] = {
        ...cell,
        value: value,
        isError: false,
        notes: [],
        isInitial: true // Lock the hint
      };

      // Prune notes for the hint
      const blockR = Math.floor(targetR / 3) * 3;
      const blockC = Math.floor(targetC / 3) * 3;
      
      for (let i = 0; i < 9; i++) {
        // Row
        if (i !== targetC) {
          newGrid[targetR][i] = { ...newGrid[targetR][i], notes: newGrid[targetR][i].notes?.filter(n => n !== value) || [] };
        }
        // Column
        if (i !== targetR) {
          newGrid[i][targetC] = { ...newGrid[i][targetC], notes: newGrid[i][targetC].notes?.filter(n => n !== value) || [] };
        }
        // Block
        const br = blockR + Math.floor(i / 3);
        const bc = blockC + (i % 3);
        if (br !== targetR || bc !== targetC) {
          newGrid[br][bc] = { ...newGrid[br][bc], notes: newGrid[br][bc].notes?.filter(n => n !== value) || [] };
        }
      }

      setBoardState({ ...boardState, grid: newGrid });
      setSelectedCell({ r: targetR, c: targetC });
      setHintsRemaining(prev => prev - 1);
      
      if (checkCompletion(newGrid)) {
        setIsCompleted(true);
      }
    }
  }, [hintsRemaining, boardState, selectedCell, isCompleted, difficulty, mistakes]);

  const fillCounts = useMemo(() => {
    if (!boardState) return { host: 0, viewer: 0 };
    let host = 0, viewer = 0;
    for (const row of boardState.grid) {
      for (const cell of row) {
        if (cell.source === 'user') host++;
        else if (cell.source === 'tiktok') viewer++;
      }
    }
    return { host, viewer };
  }, [boardState]);

  if (isLoading || !boardState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-400" />
        <p className="tracking-widest uppercase text-xs font-semibold text-slate-500">Generating Board</p>
      </div>
    );
  }

  const selectedValue = selectedCell && boardState.grid[selectedCell.r][selectedCell.c].value;
  const isValueSelected = selectedValue !== null && selectedValue !== 0;

  const getRemainingCounts = () => {
    if (!boardState) return Array(9).fill(9);
    const counts = Array(9).fill(9);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = boardState.grid[r][c].value;
        if (val !== 0) {
          counts[val - 1]--;
        }
      }
    }
    return counts;
  };
  const remainingCounts = getRemainingCounts();

  return (
    <div className="min-h-screen bg-[#5A8DF3] relative font-sans text-white overflow-x-hidden flex justify-center md:items-center">

      <div className={cn(
        "relative z-10 w-full px-4 pt-4 md:pt-0 pb-8 flex flex-col items-center transition-all duration-500",
        layoutMode === 'dashboard' ? "max-w-[1000px]" : "max-w-[440px]"
      )}>
        {/* Logo */}
        <div className="w-full flex items-center justify-center mb-6 pointer-events-none translate-y-2">
          <img 
            src="/images/logo2.svg" 
            alt="Sadoku Logo" 
            className="h-7 sm:h-10 object-contain" 
          />
        </div>

        {/* View Toggle */}
        <div className="w-full flex justify-center gap-2 mb-8 relative z-10">
           <button 
            onClick={() => !isLayoutLocked && setLayoutMode(layoutMode === 'standard' ? 'dashboard' : 'standard')}
            disabled={isLayoutLocked}
            className={cn(
              "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              isLayoutLocked ? "bg-white/5 text-white/50 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white"
            )}
           >
             {layoutMode === 'standard' ? (
                <><LayoutGrid className="w-3.5 h-3.5" /> Dashboard View</>
             ) : (
                <><LayoutList className="w-3.5 h-3.5" /> Standard View</>
             )}
           </button>
           <button
            onClick={() => setIsLayoutLocked(!isLayoutLocked)}
            className="hidden lg:flex items-center justify-center p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
            title={isLayoutLocked ? "Unlock View" : "Lock View"}
           >
             {isLayoutLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
           </button>
           <button
            onClick={() => tiktokStatus === "connected" ? disconnectTikTok() : setIsTiktokModalOpen(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              tiktokStatus === "connected" ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20" : 
              tiktokStatus === "connecting" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : 
              "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
            )}
           >
             {tiktokStatus === "connecting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />} 
             {tiktokStatus === "connected" ? "Stop Live" : tiktokStatus === "connecting" ? "Connecting..." : "TikTok Live"}
           </button>
        </div>

        {/* TikTok Modal */}
        <AnimatePresence>
          {isTiktokModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsTiktokModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">TikTok Live</h3>
                    <p className="text-xs text-slate-500 font-medium">Auto-play via comments</p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-6">
                  Enter your TikTok username to connect. Viewers can type <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">A1 6</code> to place number 6 at column A, row 1.
                </p>

                <form onSubmit={connectTikTok} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">TikTok Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold cursor-default">@</span>
                      <input 
                        type="text" 
                        value={tiktokUsername}
                        onChange={(e) => setTiktokUsername(e.target.value.replace('@',''))}
                        placeholder="username"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 pl-8 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  
                  {tiktokError && (
                    <div className="bg-rose-50 text-rose-600 text-xs font-medium px-3 py-2 rounded-lg">
                      {tiktokError}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsTiktokModalOpen(false)}
                      className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      Connect
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className={cn(
           "w-full flex flex-col gap-6",
           layoutMode === 'dashboard' ? "lg:flex-row lg:items-start lg:justify-center" : "items-center"
        )}>
          {/* LEFT COLUMN / BOARD SECTION */}
          <div className={cn(
             "w-full transition-all duration-500",
             layoutMode === 'dashboard' ? "lg:max-w-[560px]" : "max-w-[440px]"
          )}>
            {/* Board container */}
            <div className="w-full mb-2 relative">
               <div className="flex flex-col w-full bg-white rounded-xl shadow-xl shadow-blue-900/10 p-2 sm:p-3 relative overflow-hidden">
                  <AnimatePresence>
                     {(isCompleted || (difficulty !== 'sado' && mistakes >= mistakeLimit)) && (
                       <motion.div
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm"
                       >
                         {isCompleted ? (
                           <div className="flex flex-col items-center gap-3 text-center px-4 w-full">
                              <div className="flex items-center justify-center text-5xl mb-2">
                                 🏆
                              </div>
                              <h2 className="text-3xl font-bold text-[#1D4ED8] mt-2">Congratulations!</h2>
                               <p className="text-slate-500 font-medium text-lg leading-snug">
                                 You solved this puzzle in {formatTime(elapsedTime)}<br/>
                                 with {mistakes} mistake{mistakes !== 1 && 's'}.
                               </p>
                               {(fillCounts.host > 0 || fillCounts.viewer > 0) && (
                                 <div className="flex gap-6 mt-2">
                                   <div className="flex items-center gap-2">
                                     <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></span>
                                     <span className="text-slate-600 text-sm font-medium">Host: {fillCounts.host}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <span className="w-3 h-3 rounded-full bg-purple-200 border border-purple-300"></span>
                                     <span className="text-slate-600 text-sm font-medium">Viewer: {fillCounts.viewer}</span>
                                   </div>
                                 </div>
                               )}
                              <div className="flex gap-2 w-full mt-4">
                                <button onClick={onBack} className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl shadow-md hover:bg-slate-300 transition-colors">
                                  Home
                                </button>
                                <button onClick={fetchBoard} className="flex-1 py-3 bg-[#1D4ED8] text-white font-bold rounded-xl shadow-md hover:bg-[#1e40af] transition-colors">
                                  Play Again
                                </button>
                              </div>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center gap-3 text-center px-4 w-full">
                              <div className="flex items-center justify-center text-5xl mb-2">
                                 ❌
                              </div>
                              <h2 className="text-3xl font-bold text-rose-500 mt-2">Game Over!</h2>
                              <p className="text-slate-500 font-medium text-lg leading-snug">
                                 You have made {mistakes} mistake{mistakes !== 1 && 's'}.<br/>Don't give up!
                              </p>
                              <div className="flex gap-2 w-full mt-4">
                                <button onClick={onBack} className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl shadow-md hover:bg-slate-300 transition-colors">
                                  Home
                                </button>
                                <button onClick={fetchBoard} className="flex-1 py-3 bg-[#1D4ED8] text-white font-bold rounded-xl shadow-md hover:bg-[#1e40af] transition-colors">
                                  Try Again
                                </button>
                              </div>
                           </div>
                         )}
                       </motion.div>
                     )}
                  </AnimatePresence>
                  
                  {/* Column Tags Top */}
                  <div className="flex w-full mb-1">
                    <div className="w-4 sm:w-5 flex-shrink-0"></div>
                    <div className="flex-1 grid grid-cols-9">
                      {['A','B','C','D','E','F','G','H','I'].map((l) => (
                        <span key={l} className="text-center text-[12px] sm:text-sm font-mono font-bold text-slate-400">{l}</span>
                      ))}
                    </div>
                    <div className="w-4 sm:w-5 flex-shrink-0"></div>
                  </div>
                  
                  <div className="flex w-full h-full relative">
                    {/* Row Tags Left */}
                    <div className="w-4 sm:w-5 flex-shrink-0 flex flex-col justify-between py-1 sm:py-2">
                      {[1,2,3,4,5,6,7,8,9].map((n) => (
                        <span key={n} className="flex-1 flex flex-col justify-center text-center text-[12px] sm:text-sm font-mono font-bold text-slate-400 pr-1">{n}</span>
                      ))}
                    </div>

                    {/* The Grid */}
                    <div className="flex-1 grid grid-cols-3 grid-rows-3 border-2 border-[#1e3a8a] rounded-lg overflow-hidden relative bg-[#1e3a8a] gap-[2px]">
                       {[0, 1, 2].map((br) => 
                         [0, 1, 2].map((bc) => (
                           <div key={`block-${br}-${bc}`} className="grid grid-cols-3 grid-rows-3">
                             {[0, 1, 2].map((ri) => 
                               [0, 1, 2].map((ci) => {
                                 const r = br * 3 + ri;
                                 const c = bc * 3 + ci;
                                 const cell = boardState.grid[r][c];
                                 const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                                 const isSameRowOrCol = selectedCell && (selectedCell.r === r || selectedCell.c === c);
                                 const isSameBlock = selectedCell &&
                                   Math.floor(selectedCell.r / 3) === Math.floor(r / 3) &&
                                   Math.floor(selectedCell.c / 3) === Math.floor(c / 3);
                                 const isRelated = difficulty !== 'sado' && (isSameRowOrCol || isSameBlock);
                                 const highlightsSameValue = difficulty !== 'sado' && isValueSelected && cell.value === selectedValue;
                                 const isConflicting = conflictingCells.some(cc => cc.r === r && cc.c === c);
                                 const cellValue = cell.value !== 0 ? cell.value : '';

                                 let bgClass = "bg-white";
                                 let textClass = "text-slate-900 font-bold";

                                 if (isSelected) {
                                     bgClass = "bg-slate-400";
                                 } else if (highlightsSameValue) {
                                     bgClass = "bg-slate-300";
                                 } else if (isRelated) {
                                     bgClass = "bg-slate-200";
                                 }
                                 
                                 if (isConflicting) {
                                   bgClass = "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)] z-10";
                                   textClass = "text-white";
                                 }

                                  if (!cell.isInitial && cell.value !== 0) {
                                      textClass = "text-[#1D4ED8] font-normal";
                                      if (tiktokStatus === 'connected') {
                                          if (cell.source === 'tiktok') {
                                              textClass = "text-[#1D4ED8] font-bold";
                                              if (!isConflicting) bgClass = "bg-purple-200";
                                          } else {
                                              textClass = "text-[#1D4ED8] font-bold";
                                              if (!isConflicting) bgClass = "bg-emerald-100";
                                          }
                                      }
                                     if (cell.isError) {
                                         textClass = "text-rose-500 font-medium";
                                         if (!isSelected) bgClass = "bg-rose-50";
                                     }
                                 }

                                 let cellContent: React.ReactNode = cellValue;
                                 if (cell.value === 0 && cell.notes && cell.notes.length > 0) {
                                     cellContent = (
                                         <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px] pointer-events-none">
                                            {[1,2,3,4,5,6,7,8,9].map(n => (
                                               <span key={n} className="flex items-center justify-center text-[9px] sm:text-[12px] leading-none text-[#1D4ED8]/60 font-bold">
                                                  {cell.notes!.includes(n) ? n : ''}
                                               </span>
                                            ))}
                                         </div>
                                     );
                                 }

                                 return (
                                     <motion.div
                                       key={`${r}-${c}`}
                                       onClick={() => handleCellClick(r, c)}
                                       animate={isConflicting ? {
                                         scale: [1, 1.1, 1],
                                         rotate: [0, -2, 2, -2, 0],
                                       } : { scale: 1, rotate: 0 }}
                                       transition={{ duration: 0.15, repeat: 2 }}
                                       className={cn(
                                          "aspect-square flex items-center justify-center text-xl sm:text-2xl cursor-pointer select-none transition-colors",
                                          ci < 2 && "border-r border-slate-400",
                                          ri < 2 && "border-b border-slate-400",
                                          layoutMode === 'dashboard' ? "lg:text-3xl" : "",
                                          bgClass,
                                          textClass
                                       )}
                                     >
                                       {cellContent}
                                     </motion.div>
                                 );
                               })
                             )}
                           </div>
                         ))
                       )}
                    </div>

                    {/* Row Tags Right */}
                    <div className="w-4 sm:w-5 flex-shrink-0 flex flex-col justify-between py-1 sm:py-2">
                       {[1,2,3,4,5,6,7,8,9].map((n) => (
                        <span key={n} className="flex-1 flex flex-col justify-center text-center text-[12px] sm:text-sm font-mono font-bold text-slate-400 pl-1">{n}</span>
                      ))}
                    </div>
                  </div>

                  {/* Column Tags Bottom */}
                  <div className="flex w-full mt-1">
                    <div className="w-4 sm:w-5 flex-shrink-0"></div>
                    <div className="flex-1 grid grid-cols-9">
                      {['A','B','C','D','E','F','G','H','I'].map((l) => (
                        <span key={l} className="text-center text-[12px] sm:text-sm font-mono font-bold text-slate-400">{l}</span>
                      ))}
                    </div>
                    <div className="w-4 sm:w-5 flex-shrink-0"></div>
                  </div>
               </div>
            </div>

            {/* Status Indicators */}
            {difficulty !== 'sado' ? (
              <div className="w-full flex items-center justify-between mb-6 px-1">
                 <span className="text-white/90 font-light text-xs sm:text-sm capitalize">{difficulty === 'expert' ? 'Expert' : difficulty === 'hard' ? 'Hard' : difficulty === 'medium' ? 'Medium' : 'Beginner'}</span>
                 <span className="text-white/90 font-light text-xs sm:text-sm">Mistakes: {mistakes}/{mistakeLimit === Infinity ? '∞' : mistakeLimit}</span>
                 <span className="text-white/90 font-light text-xs sm:text-sm">{formatTime(elapsedTime)}</span>
                 <span className="text-white/90 font-light text-xs sm:text-sm">Hints: {hintsRemaining}/3</span>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-1 mb-6 mt-1 px-1">
                 <div className="flex items-center gap-4 mb-1">
                   <span className="text-white/90 font-light text-sm sm:text-base capitalize">Hardcore</span>
                   <span className="text-white/40">|</span>
                   <span className="text-white/90 font-light text-sm sm:text-base">{formatTime(elapsedTime)}</span>
                 </div>
                 <span className="text-rose-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">No Mistakes. No Hints. Just Brain.</span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN / CONTROLS SECTION */}
          <div className={cn(
             "w-full transition-all duration-500",
             layoutMode === 'dashboard' ? "lg:flex-1 lg:max-w-[420px]" : "max-w-[440px]"
          )}>
            {/* Numpad */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 w-full">
               {layoutMode === 'dashboard' ? (
                 <div className="flex flex-wrap justify-center gap-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                        const isComplete = difficulty !== 'sado' && remainingCounts[num - 1] === 0;
                        return (
                          <button
                             key={num}
                             onClick={() => handleInput(num)}
                             disabled={isComplete}
                             className={cn(
                               "w-[calc(20%-6.4px)] flex flex-col items-center justify-center py-4 lg:py-5 xl:py-6 rounded-xl transition-all text-center",
                               isComplete ? "bg-slate-300 opacity-50 cursor-not-allowed" : "active:scale-95",
                               !isComplete && (isNotesMode
                                  ? "bg-slate-300 hover:bg-slate-400 shadow-inner"
                                  : "bg-[#F0F4FA] hover:bg-[#D4E0F9]")
                             )}
                          >
                             <span className={cn(
                               "font-bold text-2xl sm:text-3xl leading-none mb-3 lg:mb-4",
                               isComplete ? "text-slate-500" : (isNotesMode ? "text-slate-700 font-extrabold" : "text-[#1D4ED8]")
                             )}>{num}</span>
                             {difficulty !== 'sado' && (
                               <span className={cn("text-[12px] sm:text-sm font-medium", isComplete ? "text-slate-500" : "text-slate-500")}>
                                 {9 - remainingCounts[num - 1]}<span className="opacity-50">/9</span>
                               </span>
                             )}
                          </button>
                        );
                    })}
                 </div>
               ) : (
                 <div className="flex justify-between gap-1 sm:gap-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                        const isComplete = difficulty !== 'sado' && remainingCounts[num - 1] === 0;
                        return (
                          <button
                             key={num}
                             onClick={() => handleInput(num)}
                             disabled={isComplete}
                             className={cn(
                               "flex-1 flex flex-col items-center justify-center aspect-[1/1.6] sm:aspect-[1/1.5] max-h-[70px] rounded-xl transition-all text-center",
                               isComplete ? "bg-slate-300 opacity-50 cursor-not-allowed" : "active:scale-95",
                               !isComplete && (isNotesMode
                                  ? "bg-slate-300 hover:bg-slate-400 shadow-inner"
                                  : "bg-[#F0F4FA] hover:bg-[#D4E0F9]")
                             )}
                          >
                             <span className={cn(
                               "font-bold text-xl sm:text-2xl leading-none mb-1",
                               isComplete ? "text-slate-500" : (isNotesMode ? "text-slate-700 font-extrabold" : "text-[#1D4ED8]")
                             )}>{num}</span>
                             {difficulty !== 'sado' && (
                               <span className={cn("text-[11px] font-medium", isComplete ? "text-slate-500" : "text-slate-500")}>
                                 {9 - remainingCounts[num - 1]}<span className="opacity-50">/9</span>
                               </span>
                             )}
                          </button>
                        );
                    })}
                 </div>
               )}

               <div className={cn(
                 "flex justify-between gap-2 w-full mt-2",
                 layoutMode === 'dashboard' ? "lg:mt-4 lg:gap-3" : ""
               )}>
                  <button
                     onClick={handleUndo}
                     disabled={history.length === 0 || isCompleted}
                     className={cn(
                       "flex-1 flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl active:scale-95 transition-all",
                       history.length === 0 || isCompleted ? "bg-slate-100 text-slate-300 pointer-events-none" : "bg-[#F0F4FA] text-[#1D4ED8] hover:bg-[#D4E0F9]"
                     )}
                  >
                      <Undo2 className="w-5 h-5 mb-1" />
                      <span className="text-[10px] sm:text-[11px] font-semibold">Undo</span>
                  </button>
                  <button
                     onClick={() => handleInput(0)}
                     className="flex-1 flex flex-col items-center justify-center py-2 sm:py-3 bg-[#F0F4FA] text-[#1D4ED8] rounded-xl hover:bg-[#D4E0F9] active:scale-95 transition-all"
                  >
                      <Delete className="w-5 h-5 mb-1" />
                      <span className="text-[10px] sm:text-[11px] font-semibold">Erase</span>
                  </button>
                  <button
                     onClick={() => setIsNotesMode(!isNotesMode)}
                     className={cn(
                       "flex-1 flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl active:scale-95 transition-all",
                       isNotesMode ? "bg-[#D4E0F9] text-[#1D4ED8]" : "bg-[#F0F4FA] text-[#1D4ED8] hover:bg-[#D4E0F9]"
                     )}
                  >
                      <Pencil className="w-5 h-5 mb-1" />
                      <span className="text-[10px] sm:text-[11px] font-semibold">Notes {isNotesMode ? 'On' : 'Off'}</span>
                  </button>
                  {difficulty !== 'sado' && (
                    <button
                       onClick={handleHint}
                       disabled={hintsRemaining <= 0}
                       className={cn(
                         "flex-1 flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl active:scale-95 transition-all",
                         hintsRemaining <= 0 ? "bg-slate-200 text-slate-400" : "bg-[#F0F4FA] text-[#1D4ED8] hover:bg-[#D4E0F9]"
                       )}
                    >
                        <Lightbulb className="w-5 h-5 mb-1" />
                        <span className="text-[10px] sm:text-[11px] font-semibold">{hintsRemaining > 0 ? `Hint (${hintsRemaining})` : '0 Hints'}</span>
                    </button>
                  )}
               </div>
            </div>

            {/* Bottom Actions */}
            <div className="w-full flex justify-between gap-3 mt-6">
                <button onClick={onBack} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5">
                    <ChevronLeft className="w-4 h-4" /> New Game
                </button>
                <button onClick={resetBoard} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5">
                    <RotateCcw className="w-4 h-4" /> Restart
                </button>
            </div>
            
            {DEBUG_MODE && (
               <button onClick={handleAutoWin} className="w-full mt-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                  Auto Resolve
               </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
