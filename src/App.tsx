import ErrorBoundary from '@/components/ErrorBoundary';
import { AppProvider } from '@/context/AppContext';
import { SupabaseDataProvider } from '@/context/SupabaseDataContext';
import { ToastProvider } from '@/context/ToastContext.tsx';
import { useApp } from '@/hooks/useApp';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import { routes } from '@/routes/routes';
import { GlobalHeader } from '@/shared/components/layout/GlobalHeader';
import RealtimeSync from '@/components/RealtimeSync';
import DataSync from '@/components/DataSync';

function AppContent() {
  const { state } = useApp();
  
  // Initialize real-time status synchronization
  useRealtimeStatus();
  
  const CurrentRoute = routes[state.currentPhase] || routes['daily-operations'];
  
  return (
    <div className="min-h-screen bg-black">
      <GlobalHeader />
      <RealtimeSync />
      <DataSync />
      <main className="pt-24">
        <div className="h-4 mb-4 invisible"></div>
        <CurrentRoute />
      </main>
    </div>
  );
}


function App() {
  return (
    <ErrorBoundary>
      <SupabaseDataProvider>
        <AppProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AppProvider>
      </SupabaseDataProvider>
    </ErrorBoundary>
  );
}

export default App;
