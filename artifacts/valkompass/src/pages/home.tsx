import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { useGetStats, useGetQuiz, QuizPayloadLevel } from '@workspace/api-client-react';
import { ArrowRight, MapPin, Building, Flag, ShieldCheck, Lock, Share2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoredQuiz, useAppStore } from '@/hooks/use-local-answers';
import { calculateMatches } from '@/lib/matching';

function SplashIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 400 : 1200;
    
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-500"
      style={{ 
        animation: 'fadeOut 0.5s ease-out forwards',
        animationDelay: '0.8s'
      }}
    >
      <style>{`
        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeOut {
            to { opacity: 0; }
          }
        }
      `}</style>
      <div className="flex items-center gap-3 mb-4 animate-in zoom-in duration-700">
        <Flag className="w-10 h-10 text-primary" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Valkompass</h1>
      </div>
      <p className="text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
        Oberoende. Utan konto.
      </p>
    </div>
  );
}

function LevelCard({ 
  level, 
  title, 
  description, 
  icon: Icon 
}: { 
  level: QuizPayloadLevel; 
  title: string; 
  description: string; 
  icon: any;
}) {
  const [, setLocation] = useLocation();
  const { municipalityId } = useAppStore();
  const { isCompleted, currentQuestionIndex, answers, totalQuestions: storedTotal } = useStoredQuiz(level);

  const needsMunicipality = level !== 'riksdag';
  const shouldFetchQuiz = isCompleted && (!needsMunicipality || municipalityId);

  // We only need the quiz data if we are completed, to calculate matches.
  // Actually, we also might need it to show progress "X of Y"?
  // But we only fetch if we know municipalityId for region/kommun.
  // If we don't have it, we just fetch it when they go to level-intro.
  
  // Always try to fetch if we have municipality or if it's riksdag, 
  // so we know total questions for the progress bar.
  const { data: quizPayload } = useGetQuiz(level,
    needsMunicipality ? { municipalityId: municipalityId || undefined } : undefined,
    { 
      query: { 
        queryKey: ['quiz', level, needsMunicipality ? municipalityId : undefined],
        enabled: !needsMunicipality || !!municipalityId,
        staleTime: Infinity 
      } 
    }
  );

  const topMatch = useMemo(() => {
    if (!isCompleted || !quizPayload) return null;
    const userAnswersArray = Object.values(answers);
    const matches = calculateMatches(quizPayload.parties, userAnswersArray, quizPayload.questions);
    return matches.sort((a, b) => b.matchPercent - a.matchPercent)[0];
  }, [isCompleted, quizPayload, answers]);

  const totalQuestions = quizPayload?.questions.length || storedTotal || 0;
  const answeredCount = Object.keys(answers).length;
  
  const isStarted = answeredCount > 0 || currentQuestionIndex > 0;

  return (
    <Card 
      className="relative group overflow-hidden border-2 hover:border-primary transition-colors cursor-pointer h-full flex flex-col" 
      onClick={() => setLocation(`/val/${level}`)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-6 h-6" />
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Klar
            </div>
          )}
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
        
        {/* Progress or Result display */}
        <div className="pt-4 mt-auto">
          {isCompleted ? (
            topMatch ? (
              <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg border">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-200 dark:text-slate-800"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke={topMatch.partyColor || 'currentColor'}
                      strokeWidth="8"
                      strokeDasharray={`${(topMatch.matchPercent / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold">{Math.round(topMatch.matchPercent)}%</span>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Högst matchning</div>
                  <div className="font-bold text-sm" style={{ color: topMatch.partyColor }}>
                    {topMatch.partyName}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground">
                Laddar resultat...
              </div>
            )
          ) : isStarted ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>{answeredCount} {totalQuestions > 0 ? `av ${totalQuestions}` : ''} frågor besvarade</span>
                <span>Påbörjad</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '5%' }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
          {isCompleted ? 'Visa resultat' : isStarted ? 'Fortsätt' : 'Starta Valkompass'} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats } = useGetStats({ query: { queryKey: ['stats'] } });
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem('vk-splash-seen') !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!showSplash) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => {
      setShowSplash(false);
      try {
        sessionStorage.setItem('vk-splash-seen', '1');
      } catch {
        // ignore
      }
    }, prefersReducedMotion ? 500 : 1200);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <>
      {showSplash && <SplashIntro />}
      <Layout>
        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24 px-4 text-center">
          <div className="container max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-4">
              Sveriges oberoende valkompass
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Vilket parti tycker mest som du?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Oberoende valkompass för riksdag, region och kommun inför valet 2026. Inget konto behövs. Dina svar stannar på din enhet.
            </p>
          </div>
        </section>

        {/* Choices Section */}
        <section className="px-4 pb-24 relative z-10">
          <div className="container max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <LevelCard 
                level="riksdag"
                title="Riksdag"
                description="Sveriges riksdag och regering. Frågor om lagar, skatter, försvar och nationell politik."
                icon={Flag}
              />
              
              <LevelCard 
                level="region"
                title="Region"
                description="Din region. Sjukvård, kollektivtrafik, regional utveckling och kultur."
                icon={MapPin}
              />
              
              <LevelCard 
                level="kommun"
                title="Kommun"
                description="Din hemkommun. Skola, omsorg, bostäder, vägar och lokal miljö."
                icon={Building}
              />

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
                <h3 className="text-xl font-semibold mb-3">Oberoende</h3>
                <p className="text-muted-foreground">Tjänsten ägs inte av något politiskt parti, någon valmyndighet eller mediekoncern. Alla partier behandlas lika – med objektivitet och transparens som ledord.</p>
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
    </>
  );
}
