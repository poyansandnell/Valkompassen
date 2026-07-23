import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useGetQuiz, QuizPayloadLevel, QuizQuestion, UserAnswer } from '@workspace/api-client-react';
import { useStoredQuiz, useAppStore } from '@/hooks/use-local-answers';
import { ChevronLeft, Flag, HelpCircle, AlertCircle, Info, ChevronDown, ChevronUp, X } from 'lucide-react';
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

function LiveMatchBars({ parties, userAnswers, questions, collapsed, onToggle }: any) {
  const matches = useMemo(() => {
    if (!parties || !userAnswers || !questions) return [];
    const userAnswersArray = Object.values(userAnswers) as UserAnswer[];
    const computed = calculateMatches(parties, userAnswersArray, questions);
    // Sort ALPHABETICALLY by party name (neutrality rule)
    return computed.sort((a, b) => a.partyName.localeCompare(b.partyName, 'sv'));
  }, [parties, userAnswers, questions]);

  if (matches.length === 0) return null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`fixed top-20 right-4 z-30 bg-card border shadow-lg rounded-xl overflow-hidden transition-all ${collapsed ? 'w-12' : 'w-64'} max-w-[calc(100vw-2rem)]`}>
      <button 
        onClick={onToggle} 
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors border-b"
        aria-label={collapsed ? 'Visa live-matchning' : 'Dölj live-matchning'}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {collapsed ? 'Live' : 'Live-matchning'}
        </span>
        {collapsed ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      
      {!collapsed && (
        <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {matches.map((match) => (
            <div key={match.partySlug} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate">{match.partyAbbreviation}</span>
                <span className="tabular-nums font-bold text-primary ml-2">{match.matchPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${match.matchPercent}%`, 
                    backgroundColor: match.partyColor || 'hsl(var(--primary))',
                    transitionDuration: prefersReducedMotion ? '0ms' : '700ms'
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
  
  const { data: quizPayload, isLoading, error } = useGetQuiz(validLevel, 
    validLevel !== 'riksdag' ? { municipalityId: municipalityId || undefined } : undefined,
    { query: { queryKey: ['quiz', validLevel, municipalityId] } }
  );

  const { answers, currentQuestionIndex, setAnswer, setWeight, setCurrentIndex } = useStoredQuiz(validLevel);

  const [liveCollapsed, setLiveCollapsed] = useState(false);

  const questions = quizPayload?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

  const handleAnswer = (value: number | null) => {
    if (!currentQ) return;
    setAnswer(currentQ.id, value);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentIndex(currentQuestionIndex + 1);
    } else {
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

  if (isLoading) {
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
      <header className="bg-white dark:bg-card border-b sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto h-16 flex items-center justify-between px-4">
          <button 
            onClick={handleBack} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
              Fråga {currentQuestionIndex + 1} av {questions.length}
            </span>
            <div className="w-32 sm:w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Live Match Bars */}
      {quizPayload && (
        <LiveMatchBars 
          parties={quizPayload.parties} 
          userAnswers={answers} 
          questions={questions} 
          collapsed={liveCollapsed}
          onToggle={() => setLiveCollapsed(!liveCollapsed)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 md:py-16 flex flex-col">
        
        {/* Category Label */}
        <div className="flex justify-center mb-6">
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
