import { Link, Route, Switch, Router as WouterRouter } from 'wouter';
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
import { SupportForm } from '@/components/support-form';

function InfoPages({ type }: { type: 'om' | 'metod' | 'integritet' | 'privacy' | 'kallor' | 'villkor' | 'support' }) {
  const titles = {
    'om': 'Om Valkompass',
    'metod': 'Vår metod',
    'integritet': 'Integritetspolicy',
    'privacy': 'Privacy Policy',
    'kallor': 'Källförteckning',
    'villkor': 'Användarvillkor',
    'support': 'Support'
  };
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-16 prose prose-slate dark:prose-invert">
        <h1>{titles[type]}</h1>
        <p className="lead">{type === 'om'
          ? 'Vad Valkompass är – och vad tjänsten inte är.'
          : type === 'support'
          ? 'Hjälp och kontaktuppgifter för Valkompass – webben och mobilappen.'
          : type === 'privacy'
          ? 'How Valkompass handles your data — for the website and the mobile app.'
          : 'Här förklarar vi hur Valkompass fungerar, vår inställning till integritet och den metod vi använder för att beräkna resultaten.'}</p>
        
        {type === 'om' && (
          <>
            <h2>En oberoende tjänst</h2>
            <p>Valkompass är en oberoende tjänst — som webbplats och mobilapp. Den är enbart ett fristående hjälpmedel för att jämföra politiska ståndpunkter inför valen 2026, aldrig en röstningsrekommendation.</p>
            <h2>Ansvarsfriskrivning</h2>
            <p>Valkompass är <strong>inte</strong> kopplad till, godkänd av eller representerar:</p>
            <ul>
              <li>Valmyndigheten</li>
              <li>Sveriges riksdag</li>
              <li>Någon kommun</li>
              <li>Någon region</li>
              <li>Någon annan svensk myndighet</li>
            </ul>
            <h2>Officiella källor</h2>
            <p>För officiell information om valen, rösträtt och röstning hänvisar vi till myndigheternas egna webbplatser:</p>
            <ul>
              <li><a href="https://www.val.se" target="_blank" rel="noopener noreferrer">Valmyndigheten – val.se</a></li>
              <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">Sveriges riksdag – riksdagen.se</a></li>
              <li><a href="https://skr.se" target="_blank" rel="noopener noreferrer">Sveriges Kommuner och Regioner – skr.se</a></li>
            </ul>
            <h2>Läs mer</h2>
            <p>Hur matchningen räknas hittar du på <Link href="/sa-fungerar-det">Så fungerar det</Link> och <Link href="/metod">Vår metod</Link>. Frågor? Kontakta oss via <Link href="/support">supporten</Link>.</p>
          </>
        )}

        {type === 'metod' && (
          <>
            <h2>Matchningsalgoritm</h2>
            <p>Varje fråga besvaras på en skala från "Instämmer helt" (2) till "Tar helt avstånd" (-2). Om en användare hoppar över en fråga, eller om ett parti saknar fastställd åsikt, räknas frågan inte med i slutpoängen.</p>
            <p>Likheten per fråga beräknas som: <code>1 - abs(användarens svar - partiets svar) / 4</code>. En perfekt träff ger 1, och maximal skillnad (2 mot -2) ger 0.</p>
            <p>Matchningsprocenten är det vägda genomsnittet av likheten över alla besvarade gemensamma frågor, där användaren kan välja att ge vissa frågor högre vikt (0.75x till 2.25x).</p>
            <p>Läs mer på sidan <Link href="/sa-fungerar-det">Så fungerar det</Link> där vi förklarar beräkningen i detalj med konkreta exempel.</p>
          </>
        )}
        
        {type === 'integritet' && (
          <>
            <p className="text-sm text-muted-foreground">Senast uppdaterad: 24 juli 2026. Denna policy gäller både webbplatsen och mobilappen Valkompass (iOS och Android). <Link href="/privacy">Read this policy in English</Link>.</p>
            <h2>Ingen inloggning, ingen spårning</h2>
            <p>Vi tror att politiska åsikter är bland det mest privata en person har. Därför sparas dina svar endast lokalt på din egen enhet — i webbläsarens lokala lagring på webben, och i appens lokala lagring på mobilen.</p>
            <p>Valkompass kräver ingen inloggning och inget konto. Vi samlar inte in namn, e-postadress, telefonnummer eller annan personlig information. Vi använder inga annons- eller spårningsverktyg från tredje part.</p>
            <p>Ingen data skickas till våra servrar förutom när du uttryckligen väljer att:</p>
            <ul>
              <li>Publicera ditt resultat (då lagras endast matchningsprocenterna, inte dina enskilda svar).</li>
              <li>Utmana en vän (då sparas dina svar temporärt i en krypterad form fram till att utmaningen löper ut).</li>
              <li>Kontakta oss via supportformuläret (se nedan).</li>
            </ul>
            <h2>Anonym statistik</h2>
            <p>När du slutför en valkompass skickas en anonym räknepuls (endast vilken valnivå som genomförts) så att vi kan visa antalet genomförda kompasser. Den innehåller ingen personlig data och kan inte kopplas till dig.</p>
            <h2>Platsåtkomst (frivillig)</h2>
            <p>Om du väljer att tillåta platsåtkomst används din position en gång för att föreslå din kommun. Positionen sparas inte och skickas aldrig till våra servrar.</p>
            <h2>Radera din data</h2>
            <p>På mobilen raderar du all lokal data via knappen "Rensa allt och börja om" på startsidan, eller genom att avinstallera appen. På webben använder du knappen nedan.</p>
            <h2>Om du kontaktar oss</h2>
            <p>Om du väljer att skriva till oss via <Link href="/support">supportformuläret</Link> sparas ditt meddelande — och namn och e-postadress om du frivilligt anger dem — på våra servrar, endast för att vi ska kunna läsa och besvara ditt ärende. Uppgifterna används inte till något annat och delas aldrig med tredje part. Vill du att ditt meddelande raderas, skriv till oss så tar vi bort det.</p>
            <button className="mt-8 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors" onClick={() => { localStorage.clear(); window.location.reload(); }}>
              Radera all min lokala data nu
            </button>
            <h2>Ansvarsfriskrivning</h2>
            <p>Valkompass är en oberoende tjänst och är inte kopplad till, godkänd av eller representerar svenska staten, Valmyndigheten, någon kommun, region eller annan myndighet. Tjänsten är enbart ett fristående hjälpmedel för att jämföra politiska ståndpunkter. För officiell information om valen, se <a href="https://www.val.se" target="_blank" rel="noopener noreferrer">val.se</a>, <a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">riksdagen.se</a> och <a href="https://skr.se" target="_blank" rel="noopener noreferrer">skr.se</a>.</p>
          </>
        )}
        
        {type === 'privacy' && (
          <>
            <p className="text-sm text-muted-foreground">Last updated: July 24, 2026. This policy applies to both the Valkompass website and the Valkompass mobile app (iOS and Android). <Link href="/integritet">Läs policyn på svenska</Link>.</p>
            <h2>No login, no tracking</h2>
            <p>We believe political opinions are among the most private things a person has. Your answers are therefore stored only locally on your own device — in your browser's local storage on the web, and in the app's local storage on mobile.</p>
            <p>Valkompass requires no login and no account. We do not collect your name, email address, phone number or any other personal information. We do not use any third-party advertising or tracking tools.</p>
            <p>No data is sent to our servers except when you explicitly choose to:</p>
            <ul>
              <li>Publish your result (only your matching percentages are stored, never your individual answers).</li>
              <li>Challenge a friend (your answers are stored temporarily in encrypted form until the challenge expires).</li>
              <li>Contact us via the support form (see below).</li>
            </ul>
            <h2>Anonymous statistics</h2>
            <p>When you complete a compass, an anonymous counter ping is sent (containing only which election level was completed) so we can show the number of completed compasses. It contains no personal data and cannot be linked to you.</p>
            <h2>Location access (optional)</h2>
            <p>If you choose to allow location access, your position is used once to suggest your municipality. The position is never stored and never sent to our servers.</p>
            <h2>Deleting your data</h2>
            <p>On mobile, you delete all local data with the "Rensa allt och börja om" (Clear everything and start over) button on the home screen, or by uninstalling the app. On the web, use the button on the <Link href="/integritet">Swedish policy page</Link>.</p>
            <h2>If you contact us</h2>
            <p>If you choose to write to us via the <Link href="/support">support form</Link>, your message — and your name and email address if you voluntarily provide them — is stored on our servers, solely so we can read and respond to your inquiry. This information is not used for anything else and is never shared with third parties. If you want your message deleted, write to us and we will remove it.</p>
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
            <p>Vid frågor eller klagomål, kontakta oss via vår <Link href="/support">supportsida</Link>.</p>
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
              <li><strong>Varifrån kommer partiernas svar?</strong> Se vår <Link href="/kallor">källförteckning</Link> och <Link href="/metod">metodsida</Link>.</li>
              <li><strong>Är ni politiskt oberoende?</strong> Ja. Tjänsten är oberoende, algoritmen är öppet redovisad och ingen matchning gynnar något parti.</li>
            </ul>
            <h3>Kontakta oss</h3>
            <p>Hittar du inte svaret? Skriv till oss via formuläret nedan så återkommer vi så snart vi kan. Ange din e-postadress om du vill ha svar.</p>
            <p>Är du företrädare för ett parti och vill lämna eller rätta era svar? Använd samma formulär så hjälper vi dig.</p>
            <SupportForm />
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
      <Route path="/om"><InfoPages type="om" /></Route>
      <Route path="/metod"><InfoPages type="metod" /></Route>
      <Route path="/integritet"><InfoPages type="integritet" /></Route>
      <Route path="/privacy"><InfoPages type="privacy" /></Route>
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
