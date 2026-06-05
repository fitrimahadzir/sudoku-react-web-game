import React, { useState } from 'react';
import { Difficulty } from '../lib/sudoku';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';

interface WelcomePageProps {
  onDifficultySelect: (diff: Difficulty) => void;
}

export default function WelcomePage({ onDifficultySelect }: WelcomePageProps) {
  const [showPopup, setShowPopup] = useState(false);

  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: 'Easy', color: 'bg-[#5A8DF3]' },
    { value: 'medium', label: 'Medium', color: 'bg-[#5A8DF3]' },
    { value: 'hard', label: 'Hard', color: 'bg-[#5A8DF3]' },
    { value: 'expert', label: 'Expert', color: 'bg-[#5A8DF3]' },
    { value: 'sado', label: 'Sado Level 💪 (Hardcore)', color: 'bg-red-600' }
  ];

  return (
    <div className="min-h-screen bg-[#5A8DF3] relative font-sans text-white flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] flex flex-col items-center z-10 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
      >
         <div className="flex flex-col items-center justify-center mb-2">
             <img src="/images/logo3.svg" alt="Sadoku Logo" className="w-32 h-32 object-contain mb-2" />
             <h1 
                className="text-5xl font-bold tracking-widest text-white mt-1" 
                style={{ fontFamily: "'MADE Tommy Soft', sans-serif" }}
             >
               SADOKU
             </h1>
         </div>

         <p className="text-white/80 mb-10 text-center font-medium text-base">Train Your Brain. Make It Sado 💪</p>

         <motion.button
            onClick={() => setShowPopup(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-3 w-64 py-4 bg-white text-[#5A8DF3] rounded-full shadow-lg font-bold text-xl uppercase tracking-wider"
         >
            <Play className="w-6 h-6 fill-current" />
            Play
         </motion.button>
      </motion.div>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl relative"
            >
               <button 
                  onClick={() => setShowPopup(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
               >
                 ✕
               </button>
               <h2 className="text-2xl font-bold text-slate-800 mb-6 mt-2">Select Difficulty</h2>
               <div className="w-full flex flex-col gap-3">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => onDifficultySelect(diff.value)}
                      className={`w-full py-3 rounded-xl font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all text-lg ${diff.color}`}
                    >
                       {diff.label}
                    </button>
                  ))}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 text-center text-white/60 text-xs font-medium leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
         @Copyright <a href="https://fitrimahadzir.my" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">fitrimahadzir.my</a>.<br />
         All Rights Reserved.
      </div>
    </div>
  );
}
