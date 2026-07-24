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
import HowItWorks from '@/pages/info-how-it-works';
import { Layout } from '@/components/layout';

// Kontaktadress för support — visas på /support och /integritet.
const SUPPORT_EMAIL = 'support@valkompass.app';

function InfoPages({ type }: { type: 'metod' | 'integritet' | 'kallor' | 'villkor' | 'support' }) {
  const titles = {
    'metod': 'Vår metod',
    'integritet': 'Integritetspolicy',
    'kallor': 'Källförteckning',
    'villkor': 'Användarvillkor',
    'support': 'Support'
  };
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-16 prose prose-slate dark:prose-invert">
        <h1>{titles[type]}</h1>
        <p className="lead">{type === 'support'
          ? 'Hjälp och kontaktuppgifter för Valkompass – webben och mobilappen.'
          : 'Här förklarar vi hur Valkompass fungerar, vår inställning till integritet och den metod vi använder för att beräkna resultaten.'}</p>
        
        {type === 'metod' && (
          <>
            <h2>Matchningsalgoritm</h2>
            <p>Varje fråga besvaras på en skala från "Instämmer helt" (2) till "Tar helt avstånd" (-2). Om en användare hoppar över en fråga, eller om ett parti saknar fastställd åsikt, räknas frågan inte med i slutpoängen.</p>
            <p>Likheten per fråga beräknas som: <code>1 - abs(användarens svar - partiets svar) / 4</code>. En perfekt träff ger 1, och maximal skillnad (2 mot -2) ger 0.</p>
            <p>Matchningsprocenten är det vägda genomsnittet av likheten över alla besvarade gemensamma frågor, där användaren kan välja att ge vissa frågor högre vikt (0.75x till 2.25x).</p>
            <p>Läs mer på sidan <a href="/sa-fungerar-det">Så fungerar det</a> där vi förklarar beräkningen i detalj med konkreta exempel.</p>
          </>
        )}
        
        {type === 'integritet' && (
          <>
            <p className="text-sm text-muted-foreground">Senast uppdaterad: 24 juli 2026. Denna policy gäller både webbplatsen och mobilappen Valkompass (iOS och Android).</p>
            <h2>Ingen inloggning, ingen spårning</h2>
            <p>Vi tror att politiska åsikter är bland det mest privata en person har. Därför sparas dina svar endast lokalt på din egen enhet — i webbläsarens lokala lagring på webben, och i appens lokala lagring på mobilen.</p>
            <p>Valkompass kräver ingen inloggning och inget konto. Vi samlar inte in namn, e-postadress, telefonnummer eller annan personlig information. Vi använder inga annons- eller spårningsverktyg från tredje part.</p>
            <p>Ingen data skickas till våra servrar förutom när du uttryckligen väljer att:</p>
            <ul>
              <li>Publicera ditt resultat (då lagras endast matchningsprocenterna, inte dina enskilda svar).</li>
              <li>Utmana en vän (då sparas dina svar temporärt i en krypterad form fram till att utmaningen löper ut).</li>
            </ul>
            <h2>Anonym statistik</h2>
            <p>När du slutför en valkompass skickas en anonym räknepuls (endast vilken valnivå som genomförts) så att vi kan visa antalet genomförda kompasser. Den innehåller ingen personlig data och kan inte kopplas till dig.</p>
            <h2>Platsåtkomst (frivillig)</h2>
            <p>Om du väljer att tillåta platsåtkomst används din position en gång för att föreslå din kommun. Positionen sparas inte och skickas aldrig till våra servrar.</p>
            <h2>Radera din data</h2>
            <p>På mobilen raderar du all lokal data via knappen "Rensa allt och börja om" på startsidan, eller genom att avinstallera appen. På webben använder du knappen nedan.</p>
            <h2>Kontakt</h2>
            <p>Frågor om integritet? Kontakta oss på <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            <button className="mt-8 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors" onClick={() => { localStorage.clear(); window.location.reload(); }}>
              Radera all min lokala data nu
            </button>
          </>
        )}
        
        {type === 'kallor' && (
          <>
            <h2>Varifrån kommer partiernas svar?</h2>
            <p>Varje svar märks tydligt med sitt ursprung:</p>
            <ul>
              <li><strong>Svar lämnat av partiet</strong> – Partiet har själva bekräftat sin ståndpunkt.</li>
              <li><strong>Bedömt från offentliga källor</strong> – Vi har gjort en redaktionell bedömning utifrån partiprogram, riksdagsmotioner och offentliga uttalanden.</li>
              <li><strong>Partiets ståndpunkt är inte fastställd</strong> – Frågan räknas inte med i matchningen.</li>
            </ul>
            <p>Vi arbetar kontinuerligt med att samla in och verifiera svar från alla partier som ställer upp i valet.</p>
          </>
        )}
        
        {type === 'villkor' && (
          <>
            <h2>Användarvillkor</h2>
            <p>Genom att använda Valkompass accepterar du följande villkor:</p>
            <ul>
              <li>Tjänsten tillhandahålls i befintligt skick utan garantier av något slag.</li>
              <li>Resultaten ska betraktas som vägledning, inte som definitiv röstningsrekommendation.</li>
              <li>Du ansvarar för innehållet du publicerar (offentliga resultatsidor). Vi förbehåller oss rätten att ta bort innehåll som bryter mot lagen eller våra riktlinjer.</li>
              <li>Vi samlar in minimal data och endast när du uttryckligen väljer att dela information (se integritetspolicyn).</li>
            </ul>
            <p>Vid frågor eller klagomål, kontakta oss på <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
          </>
        )}

        {type === 'support' && (
          <>
            <h2>Behöver du hjälp?</h2>
            <p>Valkompass är en oberoende och kostnadsfri tjänst inför valen 2026. Här hittar du svar på de vanligaste frågorna.</p>
            <h3>Vanliga frågor</h3>
            <ul>
              <li><strong>Mitt resultat försvann.</strong> Dina svar sparas endast lokalt på din enhet. Om du rensar appens data, avinstallerar appen eller byter enhet försvinner de.</li>
              <li><strong>Varför saknar vissa partier matchningsprocent?</strong> Partier behöver bedömda svar på minst 50 % av frågorna för att få en rättvis matchning. Övriga visas med beskrivning och länk till sin webbplats.</li>
              <li><strong>Varifrån kommer partiernas svar?</strong> Se vår <a href="/kallor">källförteckning</a> och <a href="/metod">metodsida</a>.</li>
              <li><strong>Är ni politiskt oberoende?</strong> Ja. Tjänsten är oberoende, algoritmen är öppet redovisad och ingen matchning gynnar något parti.</li>
            </ul>
            <h3>Kontakta oss</h3>
            <p>Hittar du inte svaret? Mejla oss på <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> så återkommer vi så snart vi kan.</p>
            <p>Är du företrädare för ett parti och vill lämna eller rätta era svar? Hör av dig till samma adress så hjälper vi dig.</p>
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
      
      <Route path="/sa-fungerar-det" component={HowItWorks} />
      <Route path="/metod"><InfoPages type="metod" /></Route>
      <Route path="/integritet"><InfoPages type="integritet" /></Route>
      <Route path="/kallor"><InfoPages type="kallor" /></Route>
      <Route path="/villkor"><InfoPages type="villkor" /></Route>
      <Route path="/support"><InfoPages type="support" /></Route>

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
