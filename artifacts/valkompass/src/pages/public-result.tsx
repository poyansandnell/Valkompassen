import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useGetResultPage, useDeleteResultPage, useReportResultPage, ResultPageReportReason } from '@workspace/api-client-react';
import { useAppStore } from '@/hooks/use-local-answers';
import { shareOrCopy, canonicalUrl } from '@/lib/share';
import { AlertCircle, Calendar, Flag, Trash2, Edit2, Share2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function PublicResult() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { resultTokens, removeResultToken } = useAppStore();

  const { data: page, isLoading, error } = useGetResultPage(slug!, {
    query: { queryKey: ['resultPage', slug], enabled: !!slug }
  });

  const deletePage = useDeleteResultPage();
  const reportPage = useReportResultPage();

  const [copied, setCopied] = useState(false);
  const [reportReason, setReportReason] = useState<ResultPageReportReason>('annat');
  const [reportDetails, setReportDetails] = useState('');
  const [reported, setReported] = useState(false);

  // Set meta title when loaded
  useEffect(() => {
    if (!page) return undefined;
    document.title = `${page.displayName || 'Ett valkompassresultat'} | Valkompass 2026`;
    if (!page.isIndexable) {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, follow';
      document.head.appendChild(meta);
      return () => { document.head.removeChild(meta); };
    }
    return undefined;
  }, [page]);

  if (isLoading) {
    return <Layout><div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (error || !page) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[50vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sidan hittades inte</h2>
          <p className="text-muted-foreground mb-6">Länken kan vara felaktig eller så har sidan tagits bort av ägaren.</p>
          <Button onClick={() => setLocation('/')}>Gå till startsidan</Button>
        </div>
      </Layout>
    );
  }

  const tokens = resultTokens[slug!];
  const isOwner = !!tokens;

  const handleDelete = () => {
    if (!tokens) return;
    deletePage.mutate({ slug: slug!, params: { token: tokens.deleteToken } }, {
      onSuccess: () => {
        removeResultToken(slug!);
        setLocation('/');
      }
    });
  };

  const pageUrl = canonicalUrl(`/resultat/${slug}`);
  const shareText = page.showBestParty && page.topMatches[0]
    ? `Jag matchar ${page.topMatches[0].matchPercent}% med ${page.topMatches[0].partyName} i Valkompassen! Vad matchar du?`
    : 'Jag har gjort Valkompassen inför valet 2026. Vad matchar du?';

  const handleWebShare = async () => {
    const outcome = await shareOrCopy({ title: 'Valkompassen', text: shareText, url: pageUrl });
    if (outcome === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    reportPage.mutate({
      slug: slug!,
      data: { reason: reportReason, details: reportDetails || null }
    }, {
      onSuccess: () => setReported(true)
    });
  };

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-background min-h-[100dvh] pb-24">
        
        {isOwner && (
          <div className="bg-primary text-primary-foreground py-3 px-4">
            <div className="container max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-5 h-5" />
                Du är ägare till den här sidan.
              </div>
              <div className="flex items-center gap-2">
                {/* <Button size="sm" variant="secondary" className="h-8"> <Edit2 className="w-4 h-4 mr-2"/> Redigera </Button> */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="h-8">
                      <Trash2 className="w-4 h-4 mr-2" /> Radera sida
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Radera offentlig sida?</DialogTitle>
                      <DialogDescription>
                        Detta kommer att ta bort sidan permanent. Länken kommer sluta fungera för alla.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="destructive" onClick={handleDelete} disabled={deletePage.isPending}>
                        Ja, radera sidan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}

        <div className="container max-w-3xl mx-auto px-4 py-12 space-y-8">
          
          <header className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold uppercase tracking-wider mb-2">
              Resultat från {page.areaName}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              {page.displayName ? page.displayName : 'Anonymt resultat'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
              {page.locality && <span className="flex items-center"><Flag className="w-4 h-4 mr-1" /> {page.locality}</span>}
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {format(new Date(page.createdAt), 'd MMMM yyyy', { locale: sv })}</span>
            </div>
          </header>

          {page.comment && (
            <Card className="bg-white dark:bg-card border-none shadow-sm mb-12 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <CardContent className="p-6 md:p-8 italic text-lg text-slate-700 dark:text-slate-300">
                "{page.comment}"
              </CardContent>
            </Card>
          )}

          {page.showBestParty && page.topMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-6">Bästa matchning</h2>
              <Card className="shadow-md border-primary/20 overflow-hidden">
                <div className="h-2 w-full" style={{ backgroundColor: page.topMatches[0].partyColor || 'var(--primary)' }} />
                <CardContent className="p-6 md:p-8 flex flex-col items-center text-center gap-4">
                  <div className="text-5xl font-black mb-2">{page.topMatches[0].partyName}</div>
                  <div className="text-6xl font-black tabular-nums text-primary tracking-tighter">
                    {page.topMatches[0].matchPercent}%
                  </div>
                  <p className="text-muted-foreground mt-4">
                    Baserat på {page.topMatches[0].basedOnQuestions} besvarade frågor i valkompassen.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {page.showFullList && page.topMatches.length > 1 && (
            <div className="space-y-4 mt-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Alla matchningar</h2>
              <div className="space-y-3">
                {page.topMatches.map((match, i) => (
                  <div key={match.partySlug} className="bg-white dark:bg-card border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full font-bold flex items-center justify-center text-white text-xs shrink-0" style={{ backgroundColor: match.partyColor || 'var(--primary)' }}>
                      {match.partyAbbreviation}
                    </div>
                    <div className="flex-1 font-semibold text-lg">{match.partyName}</div>
                    <div className="text-2xl font-bold tabular-nums">{match.matchPercent}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delningsknappar */}
          <div className="mt-12 text-center space-y-4">
            <h2 className="text-xl font-bold">Dela den här sidan</h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  Facebook
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  X
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
              <Button variant="outline" className="rounded-full" onClick={handleWebShare}>
                <Share2 className="w-4 h-4 mr-2" />
                {copied ? 'Länk kopierad!' : 'Dela / kopiera länk'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Tips för Instagram: kopiera länken och klistra in i din story eller bio.
            </p>
          </div>

          {/* CTA Banner */}
          <div className="mt-20 p-8 md:p-12 bg-primary text-primary-foreground rounded-2xl text-center shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Gör din egen Valkompass</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Testa dig mot partierna inför valet 2026. Helt oberoende. Inget konto krävs. Dina svar stannar på din enhet.
            </p>
            <Button size="lg" variant="secondary" className="text-lg h-14 px-8 rounded-full" onClick={() => setLocation('/')}>
              Starta kompassen
            </Button>
            <div className="mt-8 pt-6 border-t border-primary-foreground/20">
              <p className="text-sm opacity-90 mb-4">Eller hämta appen till din mobil:</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://apps.apple.com/se/app/valkompass/id6794240522"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-app-store"
                  className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 h-12 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=se.valkompass.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-google-play"
                  className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 h-12 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.59.68.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5 2.27 1.31M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
                  </svg>
                  Google Play
                </a>
              </div>
              <p className="text-xs opacity-75 mt-3">Google Play-versionen är på väg och länken börjar fungera när den godkänts.</p>
            </div>
          </div>

          {/* Report Footer */}
          {!isOwner && (
            <div className="mt-16 flex justify-center border-t pt-8">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Rapportera sidan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {!reported ? (
                    <form onSubmit={handleReport}>
                      <DialogHeader>
                        <DialogTitle>Rapportera offentlig sida</DialogTitle>
                        <DialogDescription>
                          Anmäl innehåll som bryter mot våra villkor.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Anledning</Label>
                          <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value as ResultPageReportReason)}
                          >
                            <option value="personuppgifter">Spridning av personuppgifter</option>
                            <option value="hot">Hot eller våld</option>
                            <option value="trakasserier">Trakasserier</option>
                            <option value="falsk_identitet">Falsk identitet</option>
                            <option value="spam">Spam</option>
                            <option value="annat">Annat</option>
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Detaljer (frivilligt)</Label>
                          <Textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={reportPage.isPending}>Skicka rapport</Button>
                      </DialogFooter>
                    </form>
                  ) : (
                    <div className="py-6 text-center">
                      <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <DialogTitle className="mb-2">Rapport skickad</DialogTitle>
                      <DialogDescription>Tack. Vi kommer att granska sidan inom kort.</DialogDescription>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
