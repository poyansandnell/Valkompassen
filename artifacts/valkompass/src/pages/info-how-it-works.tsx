import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, UserCheck, Scale, Target, Lock, Share2, Users, AlertCircle } from 'lucide-react';

export default function HowItWorks() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-16 space-y-16">
        
        <header className="text-center space-y-4 pb-8 border-b">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Så fungerar Valkompass</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            En oberoende tjänst som hjälper dig att jämföra dina åsikter med partiernas svar inför valet 2026.
          </p>
        </header>

        {/* Steg-för-steg */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
            Steg för steg
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  Steg 1: Välj valnivå
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Du väljer om du vill göra valkompassen för riksdag, region eller kommun. Riksdagsvalet gäller hela Sverige. 
                  För region- och kommunval anger du din hemkommun så att rätt frågor och partier laddas.
                </p>
                <p>
                  Om du tillåter platsåtkomst föreslår vi automatiskt din kommun baserat på din geografiska position. 
                  Du kan alltid söka och välja manuellt i listan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Steg 2: Svara på påståendena
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Du får ta ställning till ett antal politiska förslag, vanligtvis mellan 20 och 30 stycken. 
                  Varje påstående presenteras ett i taget. Du svarar genom att välja en av fem nivåer:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Instämmer helt</strong> – Du håller med påståendet fullt ut.</li>
                  <li><strong>Instämmer delvis</strong> – Du är mestadels positiv men inte helt övertygad.</li>
                  <li><strong>Varken eller</strong> – Du är neutral eller ser både för- och nackdelar.</li>
                  <li><strong>Tar delvis avstånd</strong> – Du är mestadels negativ men inte helt emot.</li>
                  <li><strong>Tar helt avstånd</strong> – Du är starkt emot påståendet.</li>
                </ul>
                <p>
                  Du kan också välja att hoppa över en fråga om du inte har en åsikt eller om frågan inte berör dig.
                </p>
                <p>
                  Dina svar sparas löpande i webbläsarens lokala lagring så att du kan pausa och fortsätta senare utan att förlora ditt arbete.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-primary" />
                  Steg 3: Vikta frågorna (frivilligt)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  För varje fråga kan du frivilligt ange hur viktig den är för dig. Det finns fyra viktningsnivåer:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Lite viktig</strong> (vikt 0,75x)</li>
                  <li><strong>Ganska viktig</strong> (vikt 1x, standard)</li>
                  <li><strong>Mycket viktig</strong> (vikt 1,5x)</li>
                  <li><strong>Avgörande</strong> (vikt 2,25x)</li>
                </ul>
                <p>
                  Om du till exempel tycker att klimatfrågor är avgörande medan du är mer neutral kring detaljfrågor om infrastruktur 
                  kan du ge klimatfrågorna högre vikt. Detta gör att de påverkar slutresultatet mer.
                </p>
                <p>
                  Om du inte anger någon viktning räknas alla frågor lika (1x).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Steg 4: Få ditt resultat
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  När du svarat på alla frågor beräknas din matchning med varje parti omedelbart. 
                  Du får se vilka partier som tycker mest som du, sorterade efter matchningsprocent.
                </p>
                <p>
                  Resultatet visar även hur många frågor matchningen bygger på, så att du kan bedöma hur tillförlitlig den är.
                </p>
                <p>
                  Du kan sedan jämföra partiers enskilda svar, publicera ditt resultat eller utmana vänner att göra samma test.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Hur matchningen räknas */}
        <section className="space-y-8 pt-8 border-t">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
            Hur matchningen räknas
          </h2>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Matchningsalgoritmen är helt transparent och matematiskt enkel. Vi använder ingen artificiell intelligens 
              eller dolda bonussystem. Partiernas storlek eller antal mandat påverkar aldrig beräkningen.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">Svarskalan</h3>
            <p>
              Varje svar kodas som ett tal på en skala:
            </p>
            <ul className="space-y-1">
              <li>Instämmer helt = <code className="bg-muted px-2 py-0.5 rounded">+2</code></li>
              <li>Instämmer delvis = <code className="bg-muted px-2 py-0.5 rounded">+1</code></li>
              <li>Varken eller = <code className="bg-muted px-2 py-0.5 rounded">0</code></li>
              <li>Tar delvis avstånd = <code className="bg-muted px-2 py-0.5 rounded">-1</code></li>
              <li>Tar helt avstånd = <code className="bg-muted px-2 py-0.5 rounded">-2</code></li>
              <li>Hoppa över = <code className="bg-muted px-2 py-0.5 rounded">null</code> (räknas inte)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">Likhet per fråga</h3>
            <p>
              För varje fråga beräknar vi likheten mellan ditt svar och partiets svar med denna formel:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm my-4">
              likhet = 1 − (|ditt svar − partiets svar| ÷ 4)
            </div>
            <p>
              Detta ger ett värde mellan 0 och 1, där 1 betyder perfekt överensstämmelse och 0 betyder maximal skillnad.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">Exempel</h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl space-y-4 my-6">
              <p className="font-semibold">Fråga: "Förnybar energi bör prioriteras framför kärnkraft."</p>
              <p>Du svarar: <strong>Instämmer helt (+2)</strong></p>
              <p>Parti A svarar: <strong>Instämmer helt (+2)</strong></p>
              <p className="text-sm text-muted-foreground">
                Likhet = 1 − |2 − 2| ÷ 4 = 1 − 0 = <strong className="text-green-600">1,0 (100%)</strong>
              </p>
              
              <hr className="my-4 border-slate-200 dark:border-slate-700" />
              
              <p>Parti B svarar: <strong>Varken eller (0)</strong></p>
              <p className="text-sm text-muted-foreground">
                Likhet = 1 − |2 − 0| ÷ 4 = 1 − 0,5 = <strong className="text-yellow-600">0,5 (50%)</strong>
              </p>
              
              <hr className="my-4 border-slate-200 dark:border-slate-700" />
              
              <p>Parti C svarar: <strong>Tar helt avstånd (−2)</strong></p>
              <p className="text-sm text-muted-foreground">
                Likhet = 1 − |2 − (−2)| ÷ 4 = 1 − 1 = <strong className="text-red-600">0,0 (0%)</strong>
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Total matchningsprocent</h3>
            <p>
              Den slutliga matchningen är det vägda genomsnittet av alla frågor du och partiet båda har besvarat:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm my-4">
              matchning = (summa av viktat likhetsvärde) ÷ (summa av vikter) × 100
            </div>
            <p>
              Om du gett en fråga vikten "Avgörande" (2,25x) räknas den alltså mer än en fråga du markerat som "Lite viktig" (0,75x).
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">Frågor som inte räknas</h3>
            <p>
              En fråga räknas <strong>inte</strong> med i matchningen om:
            </p>
            <ul className="space-y-1">
              <li>Du hoppat över frågan, eller</li>
              <li>Partiet inte har en fastställd ståndpunkt i frågan.</li>
            </ul>
            <p>
              Resultatsidan visar alltid hur många frågor matchningen faktiskt bygger på, till exempel "Baserat på 27 av 30 frågor".
            </p>
          </div>
        </section>

        {/* Vad händer med din data */}
        <section className="space-y-8 pt-8 border-t">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
            Vad händer med din data
          </h2>
          
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <Lock className="w-6 h-6 text-primary shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Dina svar stannar hos dig</h3>
                  <p className="text-muted-foreground">
                    Som standard sparas alla dina svar <strong>endast lokalt i din webbläsare</strong> på din egen enhet. 
                    Ingen data skickas till våra servrar när du svarar på frågorna eller ser ditt resultat.
                  </p>
                  <p className="text-muted-foreground">
                    Detta innebär att om du rensar din webbläsares cache eller byter enhet försvinner dina spar. 
                    Du kan när som helst radera all lokal data via vår integritetssida.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 text-muted-foreground">
            <h3 className="text-xl font-semibold text-foreground">När skickas data till servern?</h3>
            <p>Data lämnar din enhet endast i dessa frivilliga fall:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>När du publicerar ditt resultat:</strong> Du kan skapa en offentlig sida med din matchningsprocent. 
                Vi sparar då resultatet (matchningsprocenterna för partierna, inte dina enskilda svar på varje fråga) 
                och eventuellt namn, ort och kommentar om du valt att lägga till det.
              </li>
              <li>
                <strong>När du utmanar en vän:</strong> För att skapa en utmaning sparas dina svar temporärt på servern 
                i högst 7 dagar. När din vän gjort kompassen beräknas er gemensamma likhet, men dina exakta svar 
                visas aldrig för din vän — bara en sammanfattande procentsats och vilka ämnen ni är mest/minst överens om.
              </li>
              <li>
                <strong>Anonym statistik:</strong> När du slutför en valkompass skickar vi en anonym räknepuls 
                (vilken valnivå du gjort, ingen personlig data) så att vi kan visa antalet genomförda valkompasser på startsidan.
              </li>
            </ul>
          </div>
        </section>

        {/* Kvalificerade partier */}
        <section className="space-y-8 pt-8 border-t">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">4</div>
            Vad betyder "kvalificerat parti"?
          </h2>
          
          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg">
              Ett parti räknas som <strong className="text-foreground">kvalificerat</strong> när det har besvarat 
              minst 90% av frågorna i valkompassen med verifierade svar.
            </p>
            <p>
              Endast kvalificerade partier visas i den huvudsakliga topplistan på resultatsidan. Detta är ett kvalitetskrav 
              för att säkerställa att matchningen är rättvisande och byggd på tillräckligt underlag.
            </p>
            <p>
              Partier som ställer upp i valet men ännu inte nått 90%-tröskeln visas längre ner på resultatsidan 
              under rubriken "Fler partier som ställer upp", med information om hur många frågor de besvarat.
            </p>
            <p>
              Vi arbetar kontinuerligt med att samla in svar från alla partier. Vissa svar hämtas direkt från partierna själva, 
              andra bedöms redaktionellt utifrån offentliga källor som partiprogram, riksdagsmotioner och uttalanden. 
              Varje svar märks tydligt med sitt ursprung.
            </p>
          </div>
        </section>

        {/* Delning och utmaningar */}
        <section className="space-y-8 pt-8 border-t">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">5</div>
            Delning och utmaningar
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Publicera resultat
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Du kan frivilligt skapa en offentlig sida med ditt resultat. Du väljer själv exakt vad som ska synas:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Endast bästa partiet, eller hela listan</li>
                  <li>Ämnesresultat (mest/minst överens)</li>
                  <li>Namn, ort och en egen kommentar (frivilligt)</li>
                  <li>Om sidan ska indexeras av sökmotorer</li>
                </ul>
                <p className="text-sm">
                  Sidan får en unik slumpmässig länk. Du får privata koder för att senare kunna redigera eller radera sidan. 
                  Koderna sparas i din webbläsare så länge du är på samma enhet.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Utmana vänner
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  När du skapat en utmaning får du en unik länk som du skickar till en vän. 
                  Länken är giltig i 7 dagar och innehåller dina svar i krypterad form.
                </p>
                <p>
                  När din vän öppnar länken får de göra samma valkompass. När de är klara beräknas en 
                  <strong> kompis-matchning</strong> som visar:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Er gemensamma likhet i procent</li>
                  <li>Vilka tre ämnen ni är mest överens om</li>
                  <li>Vilka tre ämnen ni är minst överens om</li>
                </ul>
                <p className="text-sm">
                  <strong>Viktigt:</strong> Dina specifika svar på enskilda frågor visas aldrig för din vän. 
                  Endast den sammanfattande matchningen delas.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Vanliga frågor */}
        <section className="space-y-8 pt-8 border-t">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">6</div>
            Vanliga frågor
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Är Valkompass kopplat till något politiskt parti?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Valkompass är en oberoende tjänst som inte ägs eller styrs av något politiskt parti, 
                  Valmyndigheten eller någon mediekoncern. Alla partier behandlas lika, och syftet är att ge väljare 
                  ett transparent verktyg för att jämföra sina åsikter med partiernas ståndpunkter.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Varför visar inte alla partier 100% besvarade frågor?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Vissa partier har inte ännu lämnat svar på alla frågor, eller så har de inte någon offentligt fastställd 
                  ståndpunkt i vissa frågor. Vi arbetar löpande med att komplettera svaren. Partier som inte nått 90% 
                  kvalificerar sig inte för huvudlistan men visas ändå separat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kan jag lita på att partiernas svar är korrekta?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Ja. Varje svar märks med sitt ursprung: antingen "Svar lämnat av partiet" (då har partiet själva bekräftat sin ståndpunkt), 
                  "Bedömt från offentliga källor" (då har vi gjort en redaktionell bedömning utifrån partiprogram, motioner och uttalanden), 
                  eller "Partiets ståndpunkt är inte fastställd" (då räknas frågan inte med i matchningen).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vad betyder det om jag får låg matchning med alla partier?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  En låg matchning kan betyda att dina åsikter är mer nyanserade än de förenklade påståenden som presenteras, 
                  eller att du har en blandning av åsikter som inte riktigt passar in i något partis helhetslinje. 
                  Använd valkompassen som en startpunkt, inte som ett absolut svar. Läs mer om partiernas fullständiga 
                  program och prioriteringar innan du bestämmer dig.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kan jag göra om valkompassen?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Ja, du kan när som helst göra om valkompassen genom att klicka på "Gör om valkompassen" på resultatsidan. 
                  Dina tidigare svar raderas då.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Varifrån kommer partiernas svar?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Partiernas svar är redaktionella bedömningar utifrån deras officiella program och webbplatser, med källa vid varje svar. 
                  När en lokal partiförening inte har publicerat egna lokala ståndpunkter utgår bedömningen från partiets rikspolitik — det anges tydligt vid svaret. 
                  Partierna kan när som helst lämna in egna svar som då ersätter bedömningarna.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Disclaimer footer */}
        <section className="pt-12 border-t">
          <Card className="bg-muted/50 border-none">
            <CardContent className="p-8 flex gap-4">
              <AlertCircle className="w-6 h-6 text-muted-foreground shrink-0 mt-1" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Valkompass är ett hjälpmedel — inte en röstningsrekommendation
                </p>
                <p>
                  Resultaten ger en indikation på sakpolitisk överensstämmelse baserat på de utvalda frågorna. 
                  Ett parti kan ha många andra ståndpunkter och prioriteringar som inte täcks av valkompassen. 
                  Använd resultatet som en startpunkt för vidare research, inte som ett slutgiltigt beslutsunderlag. 
                  Läs partiernas fullständiga program och gör din egen bedömning.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </Layout>
  );
}
