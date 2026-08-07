import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Globe, Link as LinkIcon, ExternalLink, Loader2 } from 'lucide-react';
import { useCreateResultPage, QuizPayloadLevel, useGetQuiz } from '@workspace/api-client-react';
import { useStoredQuiz, useAppStore } from '@/hooks/use-local-answers';
import { calculateMatches, calculateTopicAgreements } from '@/lib/matching';
import { canonicalUrl } from '@/lib/share';

export default function PublishFlow() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const level = searchParams.get('level') as QuizPayloadLevel;
  const [, setLocation] = useLocation();

  const { municipalityId, addResultToken } = useAppStore();
  const { answers } = useStoredQuiz(level);

  const { data: quizPayload } = useGetQuiz(level, 
    level !== 'riksdag' ? { municipalityId: municipalityId || undefined } : undefined,
    { query: { queryKey: ['quiz', level, municipalityId], enabled: !!level } }
  );

  const createPage = useCreateResultPage();

  const [formData, setFormData] = useState({
    displayName: '',
    locality: '',
    comment: '',
    showBestParty: false,
    showFullList: false,
    showTopics: false,
    isIndexable: false,
    confirmPublic: false,
  });

  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.confirmPublic || !quizPayload || !level) return;

    const userAnswersArray = Object.values(answers);
    const matches = calculateMatches(quizPayload.parties, userAnswersArray, quizPayload.questions);
    const topMatches = matches.slice(0, 3); // send top 3 or more? schema requires PartyMatchSummary[]
    
    // Topic agreements for best party or overall? Schema says optional topicAgreements[]
    const bestParty = quizPayload.parties.find(p => p.slug === matches[0]?.partySlug);
    const topicAgreements = bestParty 
      ? calculateTopicAgreements(bestParty, userAnswersArray, quizPayload.questions) 
      : undefined;

    createPage.mutate({
      data: {
        level,
        areaName: quizPayload.areaName,
        displayName: formData.displayName || null,
        locality: formData.locality || null,
        comment: formData.comment || null,
        showBestParty: formData.showBestParty,
        showFullList: formData.showFullList,
        showTopics: formData.showTopics,
        isIndexable: formData.isIndexable,
        confirmPublic: formData.confirmPublic,
        topMatches,
        topicAgreements
      }
    }, {
      onSuccess: (data) => {
        addResultToken(data.publicSlug, { editToken: data.editToken, deleteToken: data.deleteToken });
        setPublishedUrl(canonicalUrl(`/resultat/${data.publicSlug}`));
      }
    });
  };

  if (!level) {
    return <Layout><div className="p-8 text-center">Ogiltig anrop. <Button onClick={() => setLocation('/')}>Gå hem</Button></div></Layout>;
  }

  if (publishedUrl) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto px-4 py-12 md:py-24">
          <Card className="border-2 border-green-500/20">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl">Sidan är publicerad!</CardTitle>
              <CardDescription className="text-base mt-2">
                Ditt resultat finns nu tillgängligt på en offentlig adress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 text-center">
              <div className="p-4 bg-muted rounded-lg flex items-center justify-center gap-3 break-all">
                <LinkIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                <a href={publishedUrl} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline text-lg">
                  {publishedUrl}
                </a>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg text-sm text-left flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  Spara den privata länken eller bokmärk den offentliga sidan. Din webbläsare har sparat koderna för att du ska kunna redigera eller ta bort sidan senare.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t bg-slate-50 dark:bg-card">
              <Button className="w-full" asChild>
                <a href={publishedUrl} target="_blank" rel="noreferrer">Besök sidan <ExternalLink className="w-4 h-4 ml-2" /></a>
              </Button>
              <Button className="w-full" variant="outline" onClick={() => setLocation(`/resultat?level=${level}`)}>
                Tillbaka till mina resultat
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-6 -ml-4 text-muted-foreground">
            &larr; Tillbaka
          </Button>
          <h1 className="text-3xl font-bold mb-3">Publicera ditt resultat</h1>
          <p className="text-muted-foreground text-lg">
            Du kan skapa en offentlig sida för att visa hur du matchar med partierna. Sidan får en unik länk du kan dela med andra.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Dina uppgifter (Frivilligt)</CardTitle>
              <CardDescription>Detta visas på den offentliga sidan. Lämna tomt om du vill vara anonym.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Namn eller alias</Label>
                <Input id="displayName" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="T.ex. Anna A eller 'Politiknörden'" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locality">Ort / Region</Label>
                <Input id="locality" value={formData.locality} onChange={e => setFormData({...formData, locality: e.target.value})} placeholder="T.ex. Umeå" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comment">Din kommentar till resultatet</Label>
                <Textarea id="comment" value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} placeholder="Blev jag förvånad? Tycker kompassen stämmer bra..." className="resize-none h-24" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vad vill du visa?</CardTitle>
              <CardDescription>Du väljer exakt hur mycket detaljer som ska vara offentliga. Allt är avstängt som standard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="space-y-1">
                  <Label htmlFor="showBestParty" className="text-base">Visa mitt bästa parti</Label>
                  <p className="text-sm text-muted-foreground">Visar vilket parti du fick högst matchning med.</p>
                </div>
                <Switch id="showBestParty" checked={formData.showBestParty} onCheckedChange={c => setFormData({...formData, showBestParty: c})} />
              </div>
              <div className="flex items-center justify-between space-x-4">
                <div className="space-y-1">
                  <Label htmlFor="showFullList" className="text-base">Visa hela topplistan</Label>
                  <p className="text-sm text-muted-foreground">Visar matchningsprocent för alla partier i kompassen.</p>
                </div>
                <Switch id="showFullList" checked={formData.showFullList} onCheckedChange={c => setFormData({...formData, showFullList: c})} />
              </div>
              <div className="flex items-center justify-between space-x-4">
                <div className="space-y-1">
                  <Label htmlFor="showTopics" className="text-base">Visa ämnesresultat</Label>
                  <p className="text-sm text-muted-foreground">Visar vilka sakfrågor ni var mest och minst överens om.</p>
                </div>
                <Switch id="showTopics" checked={formData.showTopics} onCheckedChange={c => setFormData({...formData, showTopics: c})} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-card">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="space-y-1">
                  <Label htmlFor="isIndexable" className="text-base">Tillåt sökmotorer</Label>
                  <p className="text-sm text-muted-foreground">Låt Google och andra sökmotorer hitta och indexera sidan.</p>
                </div>
                <Switch id="isIndexable" checked={formData.isIndexable} onCheckedChange={c => setFormData({...formData, isIndexable: c})} />
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
                <div className="space-y-3">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    Politiska åsikter kan vara känsliga personuppgifter. Genom att publicera skapar du en allmänt tillgänglig sida på internet.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="confirmPublic" checked={formData.confirmPublic} onCheckedChange={c => setFormData({...formData, confirmPublic: c === true})} />
                    <Label htmlFor="confirmPublic" className="text-red-900 dark:text-red-200 cursor-pointer">
                      Jag förstår att sidan blir offentlig
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={!formData.confirmPublic || createPage.isPending}>
              {createPage.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Globe className="w-5 h-5 mr-2" />}
              {createPage.isPending ? 'Publicerar...' : 'Skapa offentlig sida'}
            </Button>
          </div>

        </form>
      </div>
    </Layout>
  );
}
