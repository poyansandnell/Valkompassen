import { useMemo, useEffect, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useGetQuiz, QuizPayloadLevel, useRecordCompletion, QuizParty } from '@workspace/api-client-react';
import { useStoredQuiz, useAppStore } from '@/hooks/use-local-answers';
import { calculateMatches, calculateTopicAgreements } from '@/lib/matching';
import { shareOrCopy } from '@/lib/share';
import { AlertCircle, RefreshCcw, Share2, Globe, Users, ChevronRight, Fingerprint, Search, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function Counter({ value, duration = 800, delay = 0 }: { value: number, duration?: number, delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCount(value);
      return;
    }

    let frameId: number;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / duration));
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * value));
      
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setCount(value);
      }
    };

    const delayTimer = setTimeout(() => {
      frameId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value, duration, delay]);

  return <>{count}</>;
}

function HorizontalBar({ percent, color, delay = 0 }: { percent: number, color?: string, delay?: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setWidth(percent);
      return;
    } else {
      const t = setTimeout(() => setWidth(percent), delay);
      return () => clearTimeout(t);
    }
  }, [percent, delay]);

  return (
    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
      <div 
        className="h-full rounded-full ease-out"
        style={{ 
          width: `${width}%`, 
          backgroundColor: color || 'hsl(var(--primary))',
          transitionProperty: 'width',
          transitionDuration: width === 0 ? '0ms' : '800ms'
        }}
      />
    </div>
  );
}

function CircularProgress({ percent, color, delay = 0 }: { percent: number, color?: string, delay?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(percent);
      return;
    } else {
      const t = setTimeout(() => setValue(percent), delay);
      return () => clearTimeout(t);
    }
  }, [percent, delay]);

  const offset = 364.4 - (364.4 * value) / 100;

  return (
    <svg className="w-full h-full transform -rotate-90 absolute inset-0">
      <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
      <circle 
        cx="64" cy="64" r="58" fill="none" 
        stroke={color || 'currentColor'} 
        strokeWidth="12" 
        strokeDasharray="364.4" 
        strokeDashoffset={offset} 
        className="ease-out text-primary"
        style={{ 
          transitionProperty: 'stroke-dashoffset',
          transitionDuration: value === 0 ? '0ms' : '800ms' 
        }}
      />
    </svg>
  );
}

function UnqualifiedParties({ parties, level, municipalityId }: { parties: QuizParty[], level: string, municipalityId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const sortedParties = useMemo(() => {
    return [...parties].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }, [parties]);

  const filteredParties = useMemo(() => {
    if (!search) return sortedParties;
    const lSearch = search.toLowerCase();
    return sortedParties.filter(p => p.name.toLowerCase().includes(lSearch) || p.abbreviation.toLowerCase().includes(lSearch));
  }, [sortedParties, search]);

  if (parties.length === 0) return null;

  return (
    <div className="container max-w-3xl mx-auto px-4 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500" style={{ animationFillMode: 'both' }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border bg-white dark:bg-card rounded-xl shadow-sm overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 md:p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div>
            <h3 className="text-xl font-bold">Fler partier som ställer upp ({parties.length})</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Dessa partier ställer upp i valet men har ännu inte tillräckligt många verifierade svar för att få en rättvis matchningspoäng i kompassen (kräver 50% besvarade frågor).
            </p>
          </div>
          {isOpen ? <ChevronUp className="w-6 h-6 text-muted-foreground shrink-0 ml-4" /> : <ChevronDown className="w-6 h-6 text-muted-foreground shrink-0 ml-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="border-t">
          <div className="p-4 md:p-6 space-y-4">
            {parties.length > 8 && (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Sök parti..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {filteredParties.map(p => (
                <Link key={p.slug} href={`/partier/${level}/${p.slug}?municipalityId=${municipalityId || ''}`} className="block">
                  <div className="border bg-slate-50 dark:bg-slate-900 rounded-lg p-3 sm:p-4 flex items-center justify-between gap-4 hover:border-primary/50 transition-colors group cursor-pointer h-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full font-bold flex items-center justify-center text-white text-xs shrink-0 shadow-sm" style={{ backgroundColor: p.color || 'hsl(var(--primary))' }}>
                        {p.abbreviation}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.answeredCount} av {p.totalQuestions} frågor besvarade</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
              
              {filteredParties.length === 0 && (
                <div className="col-span-full text-center p-4 text-muted-foreground">
                  Inga partier matchade din sökning.
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function Results() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const level = searchParams.get('level') as QuizPayloadLevel;
  const [, setLocation] = useLocation();
  const [shareCopied, setShareCopied] = useState(false);

  const { municipalityId } = useAppStore();
  const { answers, reset } = useStoredQuiz(level);

  const recordCompletion = useRecordCompletion();
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (level && !recorded && Object.keys(answers).length > 0) {
      recordCompletion.mutate({ data: { level } }, {
        onSuccess: () => setRecorded(true),
        onError: () => {}
      });
    }
  }, [level, recorded, answers, recordCompletion]);

  // Kommun/region results must never be computed against the generic
  // national fallback — require a chosen municipality.
  const missingMunicipality = level !== 'riksdag' && !!level && ['region', 'kommun'].includes(level) && !municipalityId;

  useEffect(() => {
    if (missingMunicipality) {
      setLocation(`/val/${level}`);
    }
  }, [missingMunicipality, level, setLocation]);

  const { data: quizPayload, isLoading } = useGetQuiz(level, 
    level !== 'riksdag' ? { municipalityId: municipalityId || undefined } : undefined,
    { query: {
      // Same key convention as quiz/home/level-intro (riksdag uses undefined)
      // so the prefetched/cached quiz data is reused here too.
      queryKey: ['quiz', level, level !== 'riksdag' ? municipalityId : undefined],
      enabled: !missingMunicipality,
      staleTime: 5 * 60 * 1000,
    } }
  );

  const [filterInAssembly, setFilterInAssembly] = useState(false);

  const results = useMemo(() => {
    if (!quizPayload) return null;
    const userAnswersArray = Object.values(answers);
    const matches = calculateMatches(quizPayload.parties, userAnswersArray, quizPayload.questions);
    
    return {
      matches,
      userAnswersArray,
      parties: quizPayload.parties
    };
  }, [quizPayload, answers]);

  if (!level || !['riksdag', 'region', 'kommun'].includes(level)) {
    return <Layout><div className="p-8 text-center">Ogiltig valnivå. <Button onClick={() => setLocation('/')}>Gå hem</Button></div></Layout>;
  }

  if (missingMunicipality || isLoading) {
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
  
  const displayedQualifiedMatches = useMemo(() => {
    if (!filterInAssembly) return matches.filter(m => parties.find(p => p.slug === m.partySlug)?.isQualified);
    return matches.filter(m => {
      const p = parties.find(p => p.slug === m.partySlug);
      return p?.isQualified && p?.inAssembly;
    });
  }, [matches, parties, filterInAssembly]);

  const displayedNonQualifiedParties = useMemo(() => {
    const nq = parties.filter(p => !p.isQualified);
    if (!filterInAssembly) return nq;
    return nq.filter(p => p.inAssembly);
  }, [parties, filterInAssembly]);

  const originalQualifiedCount = matches.filter(m => parties.find(p => p.slug === m.partySlug)?.isQualified).length;
  const originalNonQualifiedCount = parties.filter(p => !p.isQualified).length;
  const hiddenCount = (originalQualifiedCount - displayedQualifiedMatches.length) + (originalNonQualifiedCount - displayedNonQualifiedParties.length);
  
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

  const bestParty = displayedQualifiedMatches[0];

  const handleShare = async () => {
    const outcome = await shareOrCopy({
      title: 'Valkompass 2026',
      text: 'Jag har gjort Valkompass för 2026 års val. Gör den du också och se vilka partier som tycker som du!',
      url: window.location.origin,
    });
    if (outcome === 'copied') {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-background pb-24">
        
        {/* Results Header */}
        <section className="bg-white dark:bg-card border-b pt-12 pb-24 px-4 text-center relative overflow-hidden animate-in fade-in duration-700">
          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, var(--primary) 0%, transparent 70%)' }}></div>
          <div className="container max-w-3xl mx-auto relative z-10 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Dina närmaste partier</h1>
            <p className="text-lg text-muted-foreground">
              Baserat på dina svar i valkompassen för {quizPayload.areaName}. <br className="hidden sm:block" />
              Era svar ligger närmast varandra.
            </p>
            {quizPayload.hasAssemblyData !== false && (
            <div className="flex flex-col items-center justify-center pt-2 gap-2">
              <div className="flex items-center gap-3 bg-muted/30 px-4 py-2.5 rounded-full border">
                <Switch id="assembly-filter" checked={filterInAssembly} onCheckedChange={setFilterInAssembly} />
                <Label htmlFor="assembly-filter" className="text-sm font-medium cursor-pointer">
                  {level === 'riksdag' ? 'Visa endast partier som redan sitter i riksdagen' : level === 'region' ? 'Visa endast partier som redan sitter i regionfullmäktige' : 'Visa endast partier som redan sitter i kommunfullmäktige'}
                </Label>
              </div>
              <div className={`text-xs text-muted-foreground flex items-center gap-1.5 transition-opacity duration-300 ${filterInAssembly && hiddenCount > 0 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <EyeOff className="w-3.5 h-3.5" /> {hiddenCount} {hiddenCount === 1 ? 'parti dolt' : 'partier dolda'} av filtret
              </div>
            </div>
            )}
          </div>
        </section>

        {/* Top Result Card */}
        <div className="container max-w-3xl mx-auto px-4 -mt-8 relative z-20">
          {bestParty ? (
            <Card className="shadow-lg border-2 border-primary/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both' }}>
              <div className="h-3 w-full" style={{ backgroundColor: bestParty.partyColor || 'hsl(var(--primary))' }} />
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
                    <CircularProgress percent={bestParty.matchPercent} color={bestParty.partyColor} delay={200} />
                    <span className="text-4xl font-bold tabular-nums">
                      <Counter value={bestParty.matchPercent} delay={200} />%
                    </span>
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
                  <Share2 className="w-4 h-4 mr-2" /> {shareCopied ? 'Länk kopierad!' : 'Dela kompassen'}
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
          {displayedQualifiedMatches.length > 1 && (
            <h3 className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200" style={{ animationFillMode: 'both' }}>
              Hela listan
            </h3>
          )}
          
          <div className="space-y-4">
            {displayedQualifiedMatches.slice(1).map((match, i) => {
              const delay = 300 + (i * 80);
              return (
                <Link key={match.partySlug} href={`/partier/${level}/${match.partySlug}?municipalityId=${municipalityId || ''}`} className="block">
                  <div 
                    className="bg-white dark:bg-card border rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationFillMode: 'both', animationDelay: `${delay}ms` }}
                  >
                    <div className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-white text-sm shrink-0 shadow-sm" style={{ backgroundColor: match.partyColor || 'hsl(var(--primary))' }}>
                      {match.partyAbbreviation}
                    </div>
                    <div className="flex-1 min-w-0 pr-4 border-r">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold text-lg truncate group-hover:text-primary transition-colors pr-4">{match.partyName}</h4>
                        <div className="text-2xl font-bold tabular-nums shrink-0">
                          <Counter value={match.matchPercent} delay={delay + 100} />%
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{match.basedOnQuestions} besvarade gemensamma frågor</p>
                      <HorizontalBar percent={match.matchPercent} color={match.partyColor} delay={delay + 100} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Non-qualified parties section */}
        <UnqualifiedParties parties={displayedNonQualifiedParties} level={level} municipalityId={municipalityId} />

        {/* Action Cards */}
        <div className="container max-w-3xl mx-auto px-4 mt-16 grid sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700" style={{ animationFillMode: 'both' }}>
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
        <div className="container max-w-3xl mx-auto px-4 mt-16 flex flex-col items-center justify-center border-t pt-12 text-center animate-in fade-in duration-500 delay-1000" style={{ animationFillMode: 'both' }}>
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
