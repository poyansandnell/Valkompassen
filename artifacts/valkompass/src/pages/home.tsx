import { Link, useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { useGetStats } from '@workspace/api-client-react';
import { ArrowRight, MapPin, Building, Flag, ShieldCheck, Lock, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats } = useGetStats({ query: { queryKey: ['stats'] } });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 px-4 text-center">
        <div className="container max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-4">
            Valet 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Vilket parti tycker mest som du?
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Gör en oberoende valkompass för riksdag, region eller kommun. Inget konto behövs. Dina svar stannar på din enhet.
          </p>
        </div>
      </section>

      {/* Choices Section */}
      <section className="px-4 pb-24 relative z-10">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Riksdag */}
            <Card className="relative group overflow-hidden border-2 hover:border-primary transition-colors cursor-pointer" onClick={() => setLocation('/val/riksdag')}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Flag className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Riksdag</CardTitle>
                <CardDescription className="text-base">Sveriges riksdag och regering. Frågor om lagar, skatter, försvar och nationell politik.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                  Starta Valkompass <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Region */}
            <Card className="relative group overflow-hidden border-2 hover:border-primary transition-colors cursor-pointer" onClick={() => setLocation('/val/region')}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Region</CardTitle>
                <CardDescription className="text-base">Din region. Sjukvård, kollektivtrafik, regional utveckling och kultur.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                  Starta Valkompass <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Kommun */}
            <Card className="relative group overflow-hidden border-2 hover:border-primary transition-colors cursor-pointer" onClick={() => setLocation('/val/kommun')}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Building className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Kommun</CardTitle>
                <CardDescription className="text-base">Din hemkommun. Skola, omsorg, bostäder, vägar och lokal miljö.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                  Starta Valkompass <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

          </div>

          {stats && stats.totalCompletions > 0 && (
            <div className="text-center mt-12 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="font-semibold text-foreground">{stats.totalCompletions.toLocaleString('sv-SE')}</span> valkompasser genomförda hittills.
            </div>
          )}
        </div>
      </section>

      {/* Trust factors */}
      <section className="bg-white dark:bg-card py-24 border-y">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Varför Valkompass?</h2>
            <p className="text-muted-foreground text-lg">Vi tror på en starkare demokrati genom informerad debatt. Därför har vi byggt ett verktyg du kan lita på.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Strikt Oberoende</h3>
              <p className="text-muted-foreground">Vi tillhör inga politiska partier, valmyndigheter eller mediekoncerner. Vår enda drivkraft är objektivitet och transparens.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Dina svar stannar hos dig</h3>
              <p className="text-muted-foreground">Inget konto. Ingen inloggning. Dina svar sparas som standard bara lokalt på din egen enhet, i din webbläsare.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Share2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Utmana dina vänner</h3>
              <p className="text-muted-foreground">Dela en länk med vänner och familj för att se hur väl era politiska åsikter matchar, helt utan att avslöja specifika svar.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ or How it works summary */}
      <section className="py-24 bg-muted/10">
        <div className="container max-w-3xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl font-bold">Redo att börja?</h2>
          <p className="text-lg text-muted-foreground">
            Det tar cirka fem minuter att svara på påståendena. Du kan hoppa över frågor och välja vilka ämnen som är viktigast för dig.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => setLocation('/val/riksdag')}>Starta Riksdagsvalet</Button>
            <Button size="lg" variant="outline" asChild><Link href="/sa-fungerar-det">Läs mer om hur det fungerar</Link></Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
