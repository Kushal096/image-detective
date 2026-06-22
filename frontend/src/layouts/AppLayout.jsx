import { NavBar } from '../components/layout/NavBar.jsx';

/**
 * Shared chrome for in-app pages: the animated cyber grid backdrop, the top
 * navigation, and a centered content column.
 */
export const AppLayout = ({ children, fullBleed = false }) => (
  <div className="min-h-screen cyber-grid flex flex-col">
    <NavBar />
    <main className={fullBleed ? 'flex-1' : 'flex-1 max-w-[1400px] w-full mx-auto px-4 py-6'}>
      {children}
    </main>
  </div>
);
