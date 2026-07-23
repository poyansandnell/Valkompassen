import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useGetQuiz, QuizPayloadLevel, QuizQuestion, UserAnswer } from '@workspace/api-client-react';
import { useStoredQuiz, useAppStore } from '@/hooks/use-local-answers';
import { ChevronLeft, Flag, HelpCircle, AlertCircle, Info, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react';
import { WEIGHTS, calculateMatches } from '@/lib/matching';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ANSWER_OPTIONS = [
  { value: 2, label: 'Instämmer helt', color: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600', textColor: 'text-white' },
  { value: 1, label: 'Instämmer delvis', color: 'bg-green-400 hover:bg-green-500 dark:bg-green-400/80 dark:hover:bg-green-400/90', textColor: 'text-white' },
  { value: 0, label: 'Varken eller', color: 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500', textColor: 'text-slate-900 dark:text-white' },
  { value: -1, label: 'Tar delvis avstånd', color: 'bg-red-400 hover:bg-red-500 dark:bg-red-400/80 dark:hover:bg-red-400/90', textColor: 'text-white' },
  { value: -2, label: 'Tar helt avstånd', color: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600', textColor: 'text-white' },
];

function LiveMatchBars({ parties, userAnswers, questions }: any) {
  const [expanded, setExpanded] = useState(false);
  
  const matches = useMemo(() => {
    if (!parties || !userAnswers || !questions) return [];
    const userAnswersArray = Object.values(userAnswers) as UserAnswer[];
    const computed = calculateMatches(parties, userAnswersArray, questions);
    // Sort ALPHABETICALLY by party name (neutrality rule)
    return computed.sort((a, b) => a.partyName.localeCompare(b.partyName, 'sv'));
  }, [parties, userAnswers, questions]);

  if (matches.length === 0) return <div className="w-10" />;

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDuration = prefersReducedMotion ? '0ms' : '500ms';

  return (
    <div 
      className="relative flex items-center justify-end z-50"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="h-9 px-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
        aria-label="Live-matchning"
      >
        <div className="flex items-end h-5 gap-[3px]">
          {matches.map(match => {
            const h = Math.max(4, (match.matchPercent / 100) * 20);
            return (
              <div
                key={match.partySlug}
                className="w-1.5 rounded-full transition-all ease-out"
                style={{
                  height: `${h}px`,
                  backgroundColor: match.partyColor || 'hsl(var(--primary))',
                  transitionDuration
                }}
              />
            );
          })}
        </div>
      </button>

      {expanded && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-2.5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {matches.map(match => (
            <div key={match.partySlug} className="flex items-center gap-2">
              <span className="text-[10px] font-bold w-6 shrink-0 text-right uppercase tracking-wider">{match.partyAbbreviation}</span>
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all ease-out"
                  style={{
                    width: `${match.matchPercent}%`,
                    backgroundColor: match.partyColor || 'hsl(var(--primary))',
                    transitionDuration
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Quiz() {
  const { level } = useParams<{ level: string }>();
  const validLevel = level as QuizPayloadLevel;
  const [, setLocation] = useLocation();
  
  const { municipalityId } = useAppStore();

  // Kommun/region require a chosen municipality — never fall back to the
  // generic quiz silently, since that would show the wrong (national) parties.
  const needsMunicipality = validLevel !== 'riksdag';
  const missingMunicipality = needsMunicipality && !municipalityId;

  useEffect(() => {
    if (missingMunicipality) {
      setLocation(`/val/${validLevel}`);
    }
  }, [missingMunicipality, validLevel, setLocation]);

  const { data: quizPayload, isLoading, error } = useGetQuiz(validLevel, 
    needsMunicipality ? { municipalityId: municipalityId || undefined } : undefined,
    { query: { queryKey: ['quiz', validLevel, municipalityId], enabled: !missingMunicipality } }
  );

  const { answers, currentQuestionIndex, setAnswer, setWeight, setCurrentIndex, setCompleted, setTotalQuestions, isCompleted, reset } = useStoredQuiz(validLevel);

  const [showResumeNotice, setShowResumeNotice] = useState(currentQuestionIndex > 0 && !isCompleted);

  // Remember the total question count locally so the home card can render an
  // accurate progress bar without needing to refetch the quiz.
  useEffect(() => {
    if (quizPayload) setTotalQuestions(quizPayload.questions.length);
  }, [quizPayload, setTotalQuestions]);

  const questions = quizPayload?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

  const handleAnswer = (value: number | null) => {
    if (!currentQ) return;
    
    setShowResumeNotice(false); // Hide the resume notice once they interact
    
    setAnswer(currentQ.id, value);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentIndex(currentQuestionIndex + 1);
    } else {
      setCompleted(true);
      setLocation(`/resultat?level=${validLevel}`);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentIndex(currentQuestionIndex - 1);
    } else {
      setLocation(`/val/${validLevel}`);
    }
  };

  if (missingMunicipality || isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !currentQ) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ett fel uppstod</h2>
          <p className="text-muted-foreground mb-6">Vi kunde inte ladda valkompassen. Försök igen om en stund.</p>
          <Button onClick={() => setLocation('/')}>Gå tillbaka</Button>
        </div>
      </Layout>
    );
  }

  const currentAnswer = answers[currentQ.id];
  const currentWeight = currentAnswer?.weight || 1;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-background">
      {/* Top Header & Progress */}
      <header className="bg-white dark:bg-card border-b sticky top-0 z-40">
        <div className="container max-w-3xl mx-auto h-16 flex items-center justify-between px-4 relative">
          <button 
            onClick={handleBack} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
              Fråga {currentQuestionIndex + 1} av {questions.length}
            </span>
            <div className="w-24 sm:w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end min-w-[3rem]">
            {quizPayload && (
              <LiveMatchBars 
                parties={quizPayload.parties} 
                userAnswers={answers} 
                questions={questions} 
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 md:py-16 flex flex-col relative z-0">
        
        {/* Halfway Resume Notice */}
        {showResumeNotice && (
          <div className="mb-8 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300 ml-2">Du fortsätter där du slutade.</span>
            <button 
              onClick={() => { reset(); setShowResumeNotice(false); }} 
              className="text-sm flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline font-medium px-2 py-1 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5 mr-1" />
              Börja om
            </button>
          </div>
        )}

        {/* Category Label */}
        <div className="flex justify-center mb-6 mt-2">
          <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold tracking-wide uppercase">
            {currentQ.category}
          </span>
        </div>

        {/* Question Text */}
        <h1 className="text-2xl md:text-4xl font-bold text-center mb-10 leading-snug">
          {currentQ.text}
        </h1>

        {/* Info/Explanation Expandable */}
        {(currentQ.explanation || currentQ.moreInfo || (currentQ.sources && currentQ.sources.length > 0)) && (
          <Collapsible className="mb-12 border bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-5 py-4 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Läs mer om förslaget
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 pb-5 pt-2 border-t text-sm space-y-4">
              {currentQ.explanation && (
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </div>
              )}
              {currentQ.moreInfo && (
                <div className="text-slate-600 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {currentQ.moreInfo}
                </div>
              )}
              {currentQ.sources && currentQ.sources.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase mb-2">Källor</h4>
                  <ul className="space-y-1">
                    {currentQ.sources.map((src, i) => (
                      <li key={i}>
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          {src.title} {src.date && `(${src.date})`}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Answer Buttons */}
        <div className="flex flex-col gap-3 mt-auto">
          {ANSWER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-all transform active:scale-[0.98] border-2 shadow-sm flex items-center justify-center ${
                currentAnswer?.value === opt.value
                  ? `${opt.color} ${opt.textColor} border-transparent ring-2 ring-primary ring-offset-2 ring-offset-background`
                  : `bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground`
              }`}
            >
              {opt.label}
            </button>
          ))}
          
          <button 
            onClick={() => handleAnswer(null)}
            className={`w-full mt-4 py-3 font-medium text-sm transition-colors text-muted-foreground hover:text-foreground ${currentAnswer?.value === null ? 'underline' : ''}`}
          >
            Hoppa över frågan
          </button>
        </div>

        {/* Weight Toggle */}
        <div className="mt-12 flex justify-center pb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full shadow-sm" size="sm">
                <Flag className="w-4 h-4 mr-2" />
                Viktighet: <strong className="ml-1">{WEIGHTS[currentWeight.toString() as keyof typeof WEIGHTS] || 'Ganska viktig'}</strong>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Hur viktig är frågan för dig?</DialogTitle>
                <DialogDescription>
                  Du kan ge frågor som är särskilt viktiga för dig större vikt i den slutgiltiga matchningen.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                {Object.entries(WEIGHTS).map(([weightVal, label]) => {
                  const val = parseFloat(weightVal);
                  const isSelected = currentWeight === val;
                  return (
                    <Button 
                      key={weightVal}
                      variant={isSelected ? "default" : "outline"}
                      className="justify-start text-left h-12"
                      onClick={() => setWeight(currentQ.id, val)}
                    >
                      {label}
                      {isSelected && <span className="ml-auto text-xs opacity-75">Vald</span>}
                    </Button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>

      </main>
    </div>
  );
}
