import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { GameProvider } from '@/game/store';
import { StageLayout } from '@/components/hub/StageLayout';

import Hub from '@/pages/Hub';
import Journal from '@/pages/Journal';
import Passport from '@/pages/Passport';
import Companions from '@/pages/Companions';
import Heritage from '@/pages/Heritage';
import Settings from '@/pages/Settings';
import Oracle from '@/pages/Oracle';
import Chapter from '@/pages/Chapter';
import WorldStage from '@/components/world/WorldStage';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <StageLayout>
        <Switch>
          <Route path="/" component={Hub} />
          <Route path="/journal" component={Journal} />
          <Route path="/passport" component={Passport} />
          <Route path="/companions" component={Companions} />
          <Route path="/heritage" component={Heritage} />
          <Route path="/settings" component={Settings} />
          <Route path="/oracle" component={Oracle} />
          <Route path="/chapter/:nodeId" component={Chapter} />
          <Route path="/world/:nodeId" component={WorldStage} />
          <Route component={NotFound} />
        </Switch>
      </StageLayout>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </GameProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
