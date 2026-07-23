import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import LevelIntro from '@/pages/level-intro';
import Quiz from '@/pages/quiz';
import Results from '@/pages/results';
import PublishFlow from '@/pages/publish';
import CreateChallenge from '@/pages/challenge';
import ChallengeView from '@/pages/challenge-view';
import PublicResult from '@/pages/public-result';
import PartyProfile from '@/pages/party-profile';
import { Layout } from '@/components/layout';

function InfoPages({ type }: { type: 'metod' | 'integritet' | 'sa-fungerar-det' | 'kallor' | 'villkor' }) {
  const titles = {
    'metod': 'Vår metod',
    'integritet': 'Integritetspolicy',
    'sa-fungerar-det': 'Så fungerar Valkompass',
    'kallor': 'Källförteckning',
    'villkor': 'Användarvillkor'
  };
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-16 prose prose-slate dark:prose-invert">
        <h1>{titles[type]}</h1>
        <p className="lead">Här förklarar vi hur Valkompass fungerar, vår inställning till integritet och den metod vi använder för att beräkna resultaten.</p>
        
        {type === 'metod' && (
          <>
            <h2>Matchningsalgoritm</h2>
            <p>Varje fråga besvaras på en skala från "Instämmer helt" (2) till "Tar helt avstånd" (-2). Om en användare hoppar över en fråga, eller om ett parti saknar fastställd åsikt, räknas frågan inte med i slutpoängen.</p>
            <p>Likheten per fråga beräknas som: <code>1 - abs(användarens svar - partiets svar) / 4</code>. En perfekt träff ger 1, och maximal skillnad (2 mot -2) ger 0.</p>
            <p>Matchningsprocenten är det vägda genomsnittet av likheten över alla besvarade gemensamma frågor, där användaren kan välja att ge vissa frågor högre vikt (0.75x till 2.25x).</p>
          </>
        )}
        
        {type === 'integritet' && (
          <>
            <h2>Ingen inloggning, ingen spårning</h2>
            <p>Vi tror att politiska åsikter är bland det mest privata en person har. Därför sparas dina svar endast i den lokala lagringen (localStorage) på din egen enhet.</p>
            <p>Ingen data skickas till våra servrar förutom när du uttryckligen väljer att:</p>
            <ul>
              <li>Publicera ditt resultat (då lagras endast matchningsprocenterna, inte dina enskilda svar).</li>
              <li>Utmana en vän (då sparas dina svar temporärt i en krypterad form fram till att utmaningen löper ut).</li>
            </ul>
            <button className="mt-8 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors" onClick={() => { localStorage.clear(); window.location.reload(); }}>
              Radera all min lokala data nu
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/val/:level" component={LevelIntro} />
      <Route path="/kompass/:level" component={Quiz} />
      <Route path="/resultat" component={Results} />
      <Route path="/resultat/:slug" component={PublicResult} />
      <Route path="/publicera" component={PublishFlow} />
      <Route path="/utmana" component={CreateChallenge} />
      <Route path="/utmaning/:code" component={ChallengeView} />
      <Route path="/partier/:level/:slug" component={PartyProfile} />
      
      <Route path="/metod"><InfoPages type="metod" /></Route>
      <Route path="/integritet"><InfoPages type="integritet" /></Route>
      <Route path="/sa-fungerar-det"><InfoPages type="sa-fungerar-det" /></Route>
      <Route path="/kallor"><InfoPages type="kallor" /></Route>
      <Route path="/villkor"><InfoPages type="villkor" /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
