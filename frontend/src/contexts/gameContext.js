import { createContext, useContext } from 'react';

/**
 * Game session context object + consumer hook. Kept separate from the provider
 * component so the provider file can be Fast-Refresh friendly (component-only).
 */
export const GameContext = createContext(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
