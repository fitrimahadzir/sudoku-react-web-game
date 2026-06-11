/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import SudokuGame from './components/SudokuGame';
import WelcomePage from './components/WelcomePage';
import AuthPage from './components/AuthPage';
import { Difficulty } from './lib/sudoku';
import { supabase, getUserProfile, type UserProfile } from './lib/supabase';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        setAuthUser({ id: session.user.id, email: session.user.email || '' });
        setAuthProfile(profile);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        setAuthUser({ id: session.user.id, email: session.user.email || '' });
        setAuthProfile(profile);
      } else {
        setAuthUser(null);
        setAuthProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
            <WelcomePage
              onDifficultySelect={setSelectedDifficulty}
              isLoggedIn={!!authUser}
              userEmail={authUser?.email || null}
              userRole={authProfile?.role || null}
              onShowAuth={() => setShowAuth(true)}
            />
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
              authUser={authUser}
              authProfile={authProfile}
              onShowAuth={() => setShowAuth(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && (
          <AuthPage
            onClose={() => setShowAuth(false)}
            onAuthChange={(user, profile) => {
              setAuthUser(user);
              setAuthProfile(profile);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
