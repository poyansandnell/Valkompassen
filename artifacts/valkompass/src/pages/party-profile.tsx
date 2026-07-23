import { useGetPartyProfile, QuizPayloadLevel } from '@workspace/api-client-react';
import { useParams, useSearch } from 'wouter';
import { Layout } from '@/components/layout';
import { AlertCircle, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ANSWER_LABELS = {
  2: 'Instämmer helt',
  1: 'Instämmer delvis',
  0: 'Varken eller',
  '-1': 'Tar delvis avstånd',
  '-2': 'Tar helt avstånd'
};

const ANSWER_COLORS = {
  2: 'bg-green-600 text-white',
  1: 'bg-green-400 text-white',
  0: 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-white',
  '-1': 'bg-red-400 text-white',
  '-2': 'bg-red-600 text-white'
};

export default function PartyProfile() {
  const { level, slug } = useParams<{ level: string; slug: string }>();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const municipalityId = searchParams.get('municipalityId') || undefined;

  const validLevel = level as QuizPayloadLevel;

  const { data: profile, isLoading, error } = useGetPartyProfile(
    slug,
    { level: validLevel, municipalityId },
    { query: { queryKey: ['party', slug, validLevel, municipalityId], enabled: !!slug && !!validLevel } }
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[50vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Partiet hittades inte</h2>
          <Button onClick={() => window.history.back()}>Gå tillbaka</Button>
        </div>
      </Layout>
    );
  }

  const { party, questions, answers } = profile;

  // Group questions by category
  const categories = [...new Set(questions.map(q => q.category))];
  const questionsByCategory = categories.map(cat => ({
    category: cat,
    questions: questions.filter(q => q.category === cat).map(q => {
      const ans = answers.find(a => a.questionId === q.id);
      return { question: q, answer: ans };
    })
  }));

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b relative">
        <div className="absolute top-0 w-full h-2" style={{ backgroundColor: party.color || 'var(--primary)' }} />
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-8 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka
          </Button>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
              style={{ backgroundColor: party.color || 'var(--primary)' }}
            >
              {party.abbreviation}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{party.name}</h1>
                {party.isTestData && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md">Testdata</span>
                )}
              </div>
              
              {party.description && (
                <p className="text-lg text-muted-foreground mb-4 max-w-2xl">{party.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 items-center">
                {party.website && (
                  <a href={party.website} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                    Besök webbplats <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
                <div className="inline-flex items-center text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                  <ShieldCheck className="w-4 h-4 mr-1" /> {party.answeredCount} besvarade frågor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="container max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Partiets svar i Valkompassen</h2>
        </div>

        {questionsByCategory.map(({ category, questions }) => (
          <div key={category} className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2 text-primary">{category}</h3>
            
            <div className="grid gap-4">
              {questions.map(({ question, answer }) => {
                const hasAnswer = answer && answer.value !== null;
                const originLabel = answer?.answerOrigin === 'party' ? 'Svar lämnat av partiet' : 
                                    answer?.answerOrigin === 'editorial' ? 'Bedömt från offentliga källor' : 
                                    'Partiets ståndpunkt är inte fastställd';
                
                return (
                  <Card key={question.id} className="overflow-hidden">
                    <CardContent className="p-0 flex flex-col md:flex-row">
                      <div className="flex-1 p-5 md:p-6 border-b md:border-b-0 md:border-r bg-slate-50/50 dark:bg-card">
                        <div className="font-medium text-lg mb-2">{question.text}</div>
                        {answer?.justification && (
                          <div className="text-sm text-muted-foreground mt-3 italic border-l-2 border-primary/20 pl-3">
                            "{answer.justification}"
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-4 flex items-center">
                          {originLabel}
                        </div>
                      </div>
                      <div className="w-full md:w-64 p-5 md:p-6 flex flex-col items-center justify-center bg-white dark:bg-slate-900 shrink-0 text-center gap-2">
                        {hasAnswer ? (
                          <>
                            <div className={`px-4 py-2 rounded-full font-bold text-sm w-full shadow-sm ${ANSWER_COLORS[answer.value as keyof typeof ANSWER_COLORS]}`}>
                              {ANSWER_LABELS[answer.value as keyof typeof ANSWER_LABELS]}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-muted-foreground border border-dashed rounded-full px-4 py-2 w-full">
                            Inget svar
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
