import { lazy, Suspense, type ReactNode } from 'react';
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
import { NodeWorldScreen } from '@/components/world/NodeWorldScreen';
import { GameScreen } from '@/components/game/GameScreen';

const queryClient = new QueryClient();

// DEV-only collision authoring tool (Movement Bridge PRD Task 1). The
// compile-time conditional dead-code-eliminates the dynamic import in
// production builds, so the editor never ships to players.
const MaskEditorScreen = import.meta.env.DEV
  ? lazy(() => import('@/components/dev/MaskEditorScreen'))
  : null;

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
          <Route path="/world/:nodeId/game/:gameId">
            {params => (
              // Key = route identity: params-only navigation must remount the
              // host (fresh scene/phase/input), never reuse a stale instance.
              <GameScreen
                key={`${params.nodeId}:${params.gameId}`}
                nodeId={params.nodeId}
                gameId={params.gameId}
              />
            )}
          </Route>
          <Route path="/world/:nodeId">
            {params => <NodeWorldScreen nodeId={params.nodeId} />}
          </Route>
          {import.meta.env.DEV && MaskEditorScreen ? (
            <Route path="/dev/mask-editor">
              {() => (
                <Suspense fallback={null}>
                  <MaskEditorScreen />
                </Suspense>
              )}
            </Route>
          ) : null}
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
