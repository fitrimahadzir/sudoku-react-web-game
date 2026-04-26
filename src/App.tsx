/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import SudokuGame from './components/SudokuGame';
import WelcomePage from './components/WelcomePage';
import { Difficulty } from './lib/sudoku';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  return (
    <div className="relative bg-[#5A8DF3] min-h-screen">
      <AnimatePresence mode="wait">
        {!selectedDifficulty ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="absolute inset-0"
          >
            <WelcomePage onDifficultySelect={setSelectedDifficulty} />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            className="absolute inset-0"
          >
            <SudokuGame 
              difficulty={selectedDifficulty} 
              onBack={() => setSelectedDifficulty(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
