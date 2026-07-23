import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useCreateChallenge, QuizPayloadLevel } from '@workspace/api-client-react';
import { useStoredQuiz, useAppStore } from '@/hooks/use-local-answers';
import { Users, Link as LinkIcon, Copy, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateChallenge() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const level = searchParams.get('level') as QuizPayloadLevel;
  const [, setLocation] = useLocation();

  const { municipalityId } = useAppStore();
  const { answers } = useStoredQuiz(level);

  const [senderName, setSenderName] = useState('');
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createChallenge = useCreateChallenge();

  const handleCreate = () => {
    const userAnswersArray = Object.values(answers);
    if (!userAnswersArray.length) return;

    createChallenge.mutate({
      data: {
        level,
        areaName: level === 'riksdag' ? 'Sverige' : 'Din region/kommun', // Ideally fetch from quizPayload, keeping simple
        municipalityId: municipalityId || null,
        senderName: senderName || null,
        answers: userAnswersArray
      }
    }, {
      onSuccess: (data) => {
        setChallengeUrl(`${window.location.origin}/utmaning/${data.code}`);
      }
    });
  };

  const handleCopy = () => {
    if (challengeUrl) {
      navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!level) {
    return <Layout><div className="p-8 text-center">Ogiltig valnivå.</div></Layout>;
  }

  if (challengeUrl) {
    return (
      <Layout>
        <div className="container max-w-xl mx-auto px-4 py-16 md:py-24 text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <Users className="w-10 h-10" />
          </div>
          
          <h1 className="text-4xl font-bold">Utmaningen är skapad!</h1>
          <p className="text-xl text-muted-foreground">
            Nu behöver du bara skicka länken till dina vänner. När de har gjort valkompassen får ni se hur mycket ni tycker lika.
          </p>

          <Card className="max-w-md mx-auto overflow-hidden">
            <CardContent className="p-6 bg-slate-50 dark:bg-slate-900 border-b flex flex-col items-center gap-4">
              <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Din unika länk</div>
              <div className="font-mono text-lg break-all text-primary select-all">
                {challengeUrl}
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-white dark:bg-card flex gap-3">
              <Button onClick={handleCopy} className="w-full" size="lg" variant={copied ? "default" : "secondary"}>
                {copied ? <CheckCircle className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? 'Kopierad!' : 'Kopiera länk'}
              </Button>
              <Button onClick={() => setLocation(`/resultat?level=${level}`)} className="w-full" size="lg" variant="outline">
                Tillbaka
              </Button>
            </CardFooter>
          </Card>
          
          <p className="text-sm text-muted-foreground">Länken är giltig i 7 dagar. Dina exakta svar avslöjas aldrig.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-xl mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-8 -ml-4">
          &larr; Tillbaka
        </Button>
        
        <h1 className="text-3xl font-bold mb-4">Utmana en vän</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Skapa en länk där en vän kan göra samma valkompass som du. När de är klara beräknas en "kompis-matchning" som visar hur mycket ni håller med varandra.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Vem utmanar?</CardTitle>
            <CardDescription>Skriv in ditt namn så din vän vet vem utmaningen kommer ifrån. (Frivilligt)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="senderName">Ditt namn</Label>
              <Input id="senderName" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="T.ex. Alex" />
            </div>
            
            <div className="bg-muted p-4 rounded-lg text-sm mt-4 text-muted-foreground">
              <strong>Viktigt:</strong> Dina specifika svar kommer aldrig att visas för personen du utmanar. Systemet visar enbart er gemensamma matchningsprocent och vilka ämnen ni är mest ense om.
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button size="lg" className="w-full h-14 text-lg" onClick={handleCreate} disabled={createChallenge.isPending}>
              {createChallenge.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LinkIcon className="w-5 h-5 mr-2" />}
              Skapa utmaningslänk
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}

// Needed a tiny CheckCircle component for the copy button
function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
