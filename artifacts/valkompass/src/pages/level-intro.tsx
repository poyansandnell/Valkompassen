import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useListMunicipalities, QuizPayloadLevel } from '@workspace/api-client-react';
import { useAppStore, useStoredQuiz } from '@/hooks/use-local-answers';
import { MapPin, Search, ArrowRight, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function LevelIntro() {
  const { level } = useParams<{ level: string }>();
  const [, setLocation] = useLocation();
  const validLevel = level as QuizPayloadLevel;
  
  const { municipalityId, setMunicipalityId } = useAppStore();
  const { data: municipalities, isLoading } = useListMunicipalities({ query: { queryKey: ['municipalities'] } });
  
  // Use StoredQuiz to check completion state
  const { isCompleted, lastUpdated, currentQuestionIndex, reset } = useStoredQuiz(validLevel);
  
  const [search, setSearch] = useState('');
  const [geoloading, setGeoloading] = useState(false);
  const [geoSuggestion, setGeoSuggestion] = useState<{ id: string; name: string } | null>(null);
  
  const filteredMuni = useMemo(() => {
    if (!municipalities) return [];
    if (!search) return municipalities;
    const lSearch = search.toLowerCase();
    return municipalities.filter(m => 
      m.name.toLowerCase().includes(lSearch) || m.regionName.toLowerCase().includes(lSearch)
    );
  }, [municipalities, search]);

  const needsMunicipality = validLevel === 'region' || validLevel === 'kommun';
  
  const handleStart = () => {
    if (needsMunicipality && !municipalityId) return;
    setLocation(`/kompass/${validLevel}`);
  };

  const levelName = validLevel === 'riksdag' ? 'Riksdagsvalet' : validLevel === 'region' ? 'Regionvalet' : 'Kommunvalet';

  // Attempt geolocation on mount
  useEffect(() => {
    if (!needsMunicipality || !municipalities || municipalities.length === 0 || municipalityId) return;
    if (!navigator.geolocation) return;

    setGeoloading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=sv`,
            { headers: { 'User-Agent': 'Valkompass/1.0' } }
          );
          const data = await response.json();
          let muniName = data.address?.municipality || data.address?.town || data.address?.city || null;
          if (!muniName) {
            setGeoloading(false);
            return;
          }
          muniName = muniName.replace(/ kommun$/i, '').trim();
          const matched = municipalities.find(m => m.name.toLowerCase() === muniName.toLowerCase());
          if (matched) {
            setGeoSuggestion({ id: matched.id, name: matched.name });
          }
        } catch (err) {
          // Silent fail
        } finally {
          setGeoloading(false);
        }
      },
      () => setGeoloading(false),
      { timeout: 10000 }
    );
  }, [needsMunicipality, municipalities, municipalityId]);

  const acceptSuggestion = () => {
    if (geoSuggestion) {
      setMunicipalityId(geoSuggestion.id);
      setGeoSuggestion(null);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto px-4 py-12 md:py-24">
        
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
              &larr; Tillbaka till startsidan
            </Link>
            <h1 className="text-4xl font-bold mb-4">{levelName} 2026</h1>
            <p className="text-xl text-muted-foreground">
              Du får ta ställning till ett antal politiska förslag. Det tar cirka fem minuter.
            </p>
          </div>

          <div className="bg-primary/5 rounded-xl p-6 border flex gap-4">
            <ShieldAlert className="w-6 h-6 text-primary shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold">Din data är säker</h3>
              <p className="text-sm text-muted-foreground">
                Dina svar sparas som standard bara på din enhet. Ingen inloggning krävs och du kan när som helst radera din data.
              </p>
            </div>
          </div>

          {needsMunicipality && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Välj din kommun</h3>
              <p className="text-sm text-muted-foreground">
                För att kunna matcha dig mot rätt {validLevel === 'region' ? 'region' : 'kommun'} behöver vi veta var du bor.
              </p>
              
              {geoloading && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Försöker hitta din plats...</span>
                  </CardContent>
                </Card>
              )}

              {geoSuggestion && !municipalityId && (
                <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20 animate-in fade-in slide-in-from-top-2 duration-500">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Det ser ut som att du är i <strong>{geoSuggestion.name}</strong>
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">Stämmer det?</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={acceptSuggestion} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Ja
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setGeoSuggestion(null)} className="text-green-900 dark:text-green-100">
                        Nej
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Sök kommun..." 
                  className="pl-9 bg-white dark:bg-black"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="border rounded-md divide-y max-h-64 overflow-y-auto bg-card shadow-sm">
                  {filteredMuni.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Inga kommuner hittades
                    </div>
                  ) : (
                    filteredMuni.map((muni) => (
                      <button
                        key={muni.id}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between ${municipalityId === muni.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                        onClick={() => setMunicipalityId(muni.id)}
                      >
                        <span>{muni.name}</span>
                        <span className="text-xs text-muted-foreground">{muni.regionName}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {isCompleted ? (
            <div className="space-y-4 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-6 rounded-xl flex flex-col items-center text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
                <div>
                  <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">Du har redan gjort kompassen för {levelName}</h3>
                  {lastUpdated && (
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Senast uppdaterad: {new Date(lastUpdated).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <Button size="lg" className="w-full text-lg h-14" onClick={() => setLocation(`/resultat?level=${validLevel}`)}>
                  Visa mitt resultat
                </Button>
                <Button size="lg" variant="outline" className="w-full text-lg h-14" onClick={() => { reset(); setLocation(`/kompass/${validLevel}`); }}>
                  Börja om på nytt
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-6">
              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                onClick={handleStart}
                disabled={needsMunicipality && !municipalityId}
              >
                {currentQuestionIndex > 0 ? 'Fortsätt Valkompassen' : 'Starta Valkompass'} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
