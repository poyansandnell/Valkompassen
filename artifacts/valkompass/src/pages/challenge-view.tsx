import { useState, useMemo } from 'react';
import { useLocation, useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useGetChallenge, useGetQuiz, useCompleteChallenge, QuizPayloadLevel } from '@workspace/api-client-react';
import { AlertCircle, ArrowRight, ShieldCheck, Users, PlayCircle, Trophy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { calculateUserSimilarity } from '@/lib/matching';

export default function ChallengeView() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();

  const { data: challenge, isLoading, error } = useGetChallenge(code!, {
    query: { queryKey: ['challenge', code], enabled: !!code }
  });

  const [activeQuiz, setActiveQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedData, setCompletedData] = useState<any>(null); // To store comparison results

  const { data: quizPayload } = useGetQuiz(
    challenge?.level as QuizPayloadLevel,
    challenge?.level !== 'riksdag' ? { municipalityId: challenge?.municipalityId || undefined } : undefined,
    { query: { enabled: !!challenge && activeQuiz, queryKey: ['challenge-quiz', challenge?.level, challenge?.municipalityId] } }
  );

  const completeChallenge = useCompleteChallenge();

  if (isLoading) return <Layout><div className="flex-1 flex justify-center items-center"><div className="animate-spin border-4 border-primary border-t-transparent rounded-full w-8 h-8"/></div></Layout>;

  if (error || !challenge) {
    return <Layout><div className="text-center p-12"><AlertCircle className="mx-auto w-12 h-12 text-destructive mb-4"/><h2 className="text-2xl font-bold mb-4">Utmaningen hittades inte</h2><Button onClick={() => setLocation('/')}>Gå till startsidan</Button></div></Layout>;
  }

  // 1. COMPLETED VIEW
  if (completedData) {
    const { similarityPercent, basedOnQuestions, mostAgreedTopics, mostDisagreedTopics } = completedData;
    
    return (
      <Layout>
        <div className="bg-slate-50 dark:bg-background min-h-[100dvh] pb-24 pt-12 px-4">
          <div className="container max-w-2xl mx-auto space-y-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Resultat av utmaningen</h1>
              <p className="text-lg text-muted-foreground">Du och {challenge.senderName || 'din vän'} matchar till</p>
              <div className="text-7xl font-black text-primary mt-6 mb-2 tracking-tighter">
                {similarityPercent}%
              </div>
              <p className="text-sm text-muted-foreground">Baserat på {basedOnQuestions} gemensamt besvarade frågor.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-12">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 font-bold text-lg mb-4 text-green-600 dark:text-green-500">
                    <ThumbsUp className="w-5 h-5" /> Mest överens
                  </div>
                  <ul className="space-y-4">
                    {mostAgreedTopics.map((t: any) => (
                      <li key={t.category}>
                        <div className="flex justify-between text-sm mb-1 font-medium"><span>{t.category}</span> <span>{t.agreementPercent}%</span></div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${t.agreementPercent}%` }}></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 font-bold text-lg mb-4 text-red-600 dark:text-red-500">
                    <ThumbsDown className="w-5 h-5" /> Minst överens
                  </div>
                  <ul className="space-y-4">
                    {mostDisagreedTopics.map((t: any) => (
                      <li key={t.category}>
                        <div className="flex justify-between text-sm mb-1 font-medium"><span>{t.category}</span> <span>{t.agreementPercent}%</span></div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${t.agreementPercent}%` }}></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-muted p-8 rounded-2xl text-center">
              <h3 className="font-bold text-xl mb-4">Vilket parti matchar du mest med?</h3>
              <p className="mb-6 text-muted-foreground">Gör en fullständig valkompass för att se dina egna personliga parti-matchningar.</p>
              <Button size="lg" onClick={() => setLocation('/')}>Starta min egen Valkompass</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // 2. ACTIVE QUIZ VIEW
  if (activeQuiz && quizPayload) {
    const questions = quizPayload.questions;
    const currentQ = questions[currentIndex];
    
    if (!currentQ) return <Layout>Fel vid laddning av frågor.</Layout>;

    const handleAnswer = (val: number | null) => {
      const nextAnswers = { ...answers, [currentQ.id]: val };
      setAnswers(nextAnswers);
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Finish challenge
        const payloadAnswers = Object.entries(nextAnswers).map(([qId, value]) => ({ questionId: qId, value, weight: 1 }));
        completeChallenge.mutate({
          code: code!,
          data: { answers: payloadAnswers }
        }, {
          onSuccess: (comparisonData) => {
            setCompletedData(comparisonData);
          }
        });
      }
    };

    const progress = (currentIndex / questions.length) * 100;

    return (
      <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-background">
        <header className="bg-white dark:bg-card border-b p-4 text-center">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Utmaning med {challenge.senderName || 'en vän'}</div>
          <div className="w-full max-w-md mx-auto h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
             <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </header>
        <main className="flex-1 container max-w-2xl mx-auto p-4 py-12 flex flex-col">
          <div className="text-center mb-10 mt-auto">
            <span className="text-xs font-bold uppercase px-3 py-1 bg-muted rounded-full">{currentQ.category}</span>
            <h2 className="text-3xl font-bold mt-6 leading-tight">{currentQ.text}</h2>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
            <Button size="lg" variant="outline" className="h-14 text-lg border-2 hover:bg-green-50 hover:border-green-500 hover:text-green-700" onClick={() => handleAnswer(2)}>Instämmer helt</Button>
            <Button size="lg" variant="outline" className="h-14 text-lg border-2 hover:bg-green-50 hover:border-green-400 hover:text-green-600" onClick={() => handleAnswer(1)}>Instämmer delvis</Button>
            <Button size="lg" variant="outline" className="h-14 text-lg border-2" onClick={() => handleAnswer(0)}>Varken eller</Button>
            <Button size="lg" variant="outline" className="h-14 text-lg border-2 hover:bg-red-50 hover:border-red-400 hover:text-red-600" onClick={() => handleAnswer(-1)}>Tar delvis avstånd</Button>
            <Button size="lg" variant="outline" className="h-14 text-lg border-2 hover:bg-red-50 hover:border-red-500 hover:text-red-700" onClick={() => handleAnswer(-2)}>Tar helt avstånd</Button>
            <Button variant="ghost" className="mt-4" onClick={() => handleAnswer(null)}>Hoppa över</Button>
          </div>
        </main>
      </div>
    );
  }

  // 3. INTRO VIEW
  return (
    <Layout>
      <div className="container max-w-2xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <Users className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          {challenge.senderName ? `${challenge.senderName} har utmanat dig!` : 'Du har blivit utmanad!'}
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          Gör samma valkompass och se hur väl era politiska åsikter stämmer överens. 
          Det tar ungefär fem minuter ({challenge.questionCount} påståenden).
        </p>

        <Card className="bg-muted/50 border-none mb-12 text-left">
          <CardContent className="p-6 flex gap-4">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Dina svar förblir hemliga</h3>
              <p className="text-sm text-muted-foreground">
                Personen som utmanat dig får aldrig se exakt vad du svarat på enskilda frågor. Ni ser endast en sammanfattande procentsats och vilka ämnen ni är mest/minst överens om.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full sm:w-auto px-12 h-14 text-lg" onClick={() => setActiveQuiz(true)}>
          <PlayCircle className="w-6 h-6 mr-3" /> Anta utmaningen
        </Button>
      </div>
    </Layout>
  );
}
