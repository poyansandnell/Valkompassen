import { useMemo, useEffect, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useGetQuiz, QuizPayloadLevel, useRecordCompletion } from '@workspace/api-client-react';
import { useStoredQuiz, useAppStore } from '@/hooks/use-local-answers';
import { calculateMatches, calculateTopicAgreements } from '@/lib/matching';
import { AlertCircle, ArrowRight, RefreshCcw, Share2, Globe, Users, ChevronRight, BarChart3, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function Results() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const level = searchParams.get('level') as QuizPayloadLevel;
  const [, setLocation] = useLocation();
  
  const { municipalityId } = useAppStore();
  const { answers, reset } = useStoredQuiz(level);

  // Trigger record completion ONCE when viewing results
  const recordCompletion = useRecordCompletion();
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (level && !recorded && Object.keys(answers).length > 0) {
      recordCompletion.mutate({ data: { level } }, {
        onSuccess: () => setRecorded(true),
        onError: () => {} // Fire and forget
      });
    }
  }, [level, recorded, answers, recordCompletion]);

  const { data: quizPayload, isLoading } = useGetQuiz(level, 
    level !== 'riksdag' ? { municipalityId: municipalityId || undefined } : undefined,
    { query: { queryKey: ['quiz', level, municipalityId] } }
  );

  const results = useMemo(() => {
    if (!quizPayload) return null;
    const userAnswersArray = Object.values(answers);
    const matches = calculateMatches(quizPayload.parties, userAnswersArray, quizPayload.questions);
    
    const bestParty = matches[0];
    const topicAgreements = bestParty 
      ? calculateTopicAgreements(quizPayload.parties.find(p => p.slug === bestParty.partySlug)!, userAnswersArray, quizPayload.questions)
      : [];

    return {
      matches,
      topicAgreements,
      userAnswersArray,
      parties: quizPayload.parties
    };
  }, [quizPayload, answers]);

  if (!level || !['riksdag', 'region', 'kommun'].includes(level)) {
    return <Layout><div className="p-8 text-center">Ogiltig valnivå. <Button onClick={() => setLocation('/')}>Gå hem</Button></div></Layout>;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-medium animate-pulse">Beräknar ditt resultat...</h2>
        </div>
      </Layout>
    );
  }

  if (!quizPayload || !results) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[50vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Resultatet kunde inte beräknas</h2>
          <Button onClick={() => setLocation('/')}>Börja om</Button>
        </div>
      </Layout>
    );
  }

  const { matches, parties } = results;
  const qualifiedMatches = matches.filter(m => parties.find(p => p.slug === m.partySlug)?.isQualified);
  const nonQualifiedParties = parties.filter(p => !p.isQualified);
  
  const hasAnswers = Object.keys(answers).length > 0;

  if (!hasAnswers) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[50vh] space-y-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Fingerprint className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold max-w-md">Du har inte svarat på några frågor ännu.</h2>
          <Button size="lg" onClick={() => setLocation(`/kompass/${level}`)}>Starta valkompassen</Button>
        </div>
      </Layout>
    );
  }

  const bestParty = qualifiedMatches[0];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Valkompass 2026',
          text: 'Jag har gjort Valkompass för 2026 års val. Gör den du också och se vilka partier som tycker som du!',
          url: window.location.origin,
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      // could show toast here
    }
  };

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-background pb-24">
        
        {/* Results Header */}
        <section className="bg-white dark:bg-card border-b pt-12 pb-16 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, var(--primary) 0%, transparent 70%)' }}></div>
          <div className="container max-w-3xl mx-auto relative z-10 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Dina närmaste partier</h1>
            <p className="text-lg text-muted-foreground">
              Baserat på dina svar i valkompassen för {quizPayload.areaName}. <br className="hidden sm:block" />
              Era svar ligger närmast varandra.
            </p>
          </div>
        </section>

        {/* Top Result Card */}
        <div className="container max-w-3xl mx-auto px-4 -mt-8 relative z-20">
          {bestParty ? (
            <Card className="shadow-lg border-2 border-primary/20 overflow-hidden">
              <div className="h-3 w-full" style={{ backgroundColor: bestParty.partyColor || 'var(--primary)' }} />
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary mb-2">
                    Högst sakpolitisk matchning
                  </div>
                  <h2 className="text-4xl font-bold">{bestParty.partyName}</h2>
                  <p className="text-muted-foreground">
                    Matchningen bygger på {bestParty.basedOnQuestions} av {bestParty.totalQuestions} frågor.
                  </p>
                </div>
                
                <div className="shrink-0 flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                      <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                      <circle cx="64" cy="64" r="58" fill="none" stroke={bestParty.partyColor || 'currentColor'} strokeWidth="12" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * bestParty.matchPercent) / 100} className="transition-all duration-1000 ease-out text-primary" />
                    </svg>
                    <span className="text-4xl font-bold tabular-nums">{bestParty.matchPercent}%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 border-t flex flex-col sm:flex-row gap-3">
                <Button className="w-full sm:w-auto" variant="default" asChild>
                  <Link href={`/partier/${level}/${bestParty.partySlug}?municipalityId=${municipalityId || ''}`}>
                    Läs mer om {bestParty.partyAbbreviation} <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button className="w-full sm:w-auto" variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" /> Dela kompassen
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p>Inte tillräckligt med data för att visa en matchning.</p>
            </Card>
          )}
        </div>

        {/* Full List */}
        <div className="container max-w-3xl mx-auto px-4 mt-12 space-y-6">
          <h3 className="text-2xl font-bold">Hela listan</h3>
          
          <div className="space-y-4">
            {qualifiedMatches.slice(1).map((match, i) => (
              <Link key={match.partySlug} href={`/partier/${level}/${match.partySlug}?municipalityId=${municipalityId || ''}`}>
                <div className="bg-white dark:bg-card border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-white text-sm shrink-0" style={{ backgroundColor: match.partyColor || 'var(--primary)' }}>
                    {match.partyAbbreviation}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{match.partyName}</h4>
                    <p className="text-sm text-muted-foreground truncate">{match.basedOnQuestions} besvarade gemensamma frågor</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-bold tabular-nums">{match.matchPercent}%</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Non-qualified parties */}
        {nonQualifiedParties.length > 0 && (
          <div className="container max-w-3xl mx-auto px-4 mt-16 space-y-6">
            <h3 className="text-xl font-bold">Fler partier som ställer upp</h3>
            <p className="text-muted-foreground text-sm">
              Dessa partier ställer upp i valet men har ännu inte tillräckligt många verifierade svar för att få en rättvis matchningspoäng i kompassen (kräver 90% besvarade frågor).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {nonQualifiedParties.map(p => (
                <Link key={p.slug} href={`/partier/${level}/${p.slug}?municipalityId=${municipalityId || ''}`}>
                  <div className="border bg-white dark:bg-card rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <div className="font-semibold text-foreground mb-1">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.answeredCount} av {p.totalQuestions} svar</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="container max-w-3xl mx-auto px-4 mt-16 grid sm:grid-cols-2 gap-6">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setLocation(`/publicera?level=${level}`)}>
            <CardHeader>
              <Globe className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Publicera resultatet</CardTitle>
              <CardDescription>Skapa en offentlig länk för att visa ditt resultat på nätet eller sociala medier.</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setLocation(`/utmana?level=${level}`)}>
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Utmana en vän</CardTitle>
              <CardDescription>Skicka en privat utmaning till en vän och se hur väl era åsikter matchar.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="container max-w-3xl mx-auto px-4 mt-16 flex flex-col items-center justify-center border-t pt-12 text-center">
          <p className="text-muted-foreground mb-6">
            Kom ihåg: Valkompass är ett verktyg för att jämföra partiernas svar innan du bestämmer dig. Den är inte ett direktiv om vad du ska rösta på.
          </p>
          <Button variant="outline" onClick={() => { reset(); setLocation(`/val/${level}`); }}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Gör om valkompassen
          </Button>
        </div>

      </div>
    </Layout>
  );
}
