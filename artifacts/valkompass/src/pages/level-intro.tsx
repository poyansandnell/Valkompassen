import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useListMunicipalities, QuizPayloadLevel } from '@workspace/api-client-react';
import { useAppStore, useStoredQuiz } from '@/hooks/use-local-answers';
import { MapPin, Search, ArrowRight, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const hasRequestedGeo = useRef(false);

  const needsMunicipality = validLevel === 'region' || validLevel === 'kommun';

  const selectedMunicipality = useMemo(() => {
    if (!municipalityId || !municipalities) return null;
    return municipalities.find(m => m.id === municipalityId);
  }, [municipalityId, municipalities]);

  // Initialize search with selected municipality if it exists
  useEffect(() => {
    if (selectedMunicipality && search === '') {
      setSearch(selectedMunicipality.name);
    }
  }, [selectedMunicipality]);

  const filteredMuni = useMemo(() => {
    if (!municipalities) return [];
    if (!search) return municipalities;
    const lSearch = search.toLowerCase();
    return municipalities.filter(m => 
      m.name.toLowerCase().includes(lSearch) || m.regionName.toLowerCase().includes(lSearch)
    );
  }, [municipalities, search]);

  const handleStart = () => {
    if (needsMunicipality && !municipalityId) return;
    setLocation(`/kompass/${validLevel}`);
  };

  const levelName = validLevel === 'riksdag' ? 'Riksdagsvalet' : validLevel === 'region' ? 'Regionvalet' : 'Kommunvalet';

  // Attempt geolocation on mount
  useEffect(() => {
    if (!needsMunicipality || !municipalities || municipalities.length === 0) return;
    if (municipalityId) return; // Already selected
    if (hasRequestedGeo.current) return;
    if (!navigator.geolocation) return;

    hasRequestedGeo.current = true;
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
          // Nominatim answers e.g. "Katrineholms kommun" — strip " kommun"
          // and handle the genitive "s" ("Katrineholms" -> "Katrineholm").
          const stripped = muniName.replace(/s? kommun$/i, '').trim().toLowerCase();
          const matched = municipalities.find(m => {
            const n = m.name.toLowerCase();
            return n === stripped || `${n}s` === stripped || n === `${stripped}s`;
          });
          if (matched) {
            setGeoSuggestion({ id: matched.id, name: matched.name });
          }
        } catch (err) {
          // Silent fail
        } finally {
          setGeoloading(false);
        }
      },
      () => setGeoloading(false), // Silent fail on denial
      // maximumAge: reuse a cached position (up to 10 min old) so the
      // suggestion appears quickly instead of waiting for a fresh GPS fix.
      { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }, [needsMunicipality, municipalities, municipalityId]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (municipalityId) {
      setMunicipalityId(null);
    }
  };

  const handleSelectMuni = (muni: { id: string; name: string }) => {
    setMunicipalityId(muni.id);
    setSearch(muni.name);
  };

  const handleClear = () => {
    setMunicipalityId(null);
    setSearch('');
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
              <div>
                <h3 className="text-lg font-medium">Välj din kommun</h3>
                <p className="text-sm text-muted-foreground">
                  För att kunna matcha dig mot rätt {validLevel === 'region' ? 'region' : 'kommun'} behöver vi veta var du bor.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Sök kommun..." 
                  className="pl-9 h-11 bg-white dark:bg-black"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {selectedMunicipality ? (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200 mt-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {selectedMunicipality.name}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        {selectedMunicipality.regionName}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleClear} className="text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/50">
                    Ändra
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md divide-y max-h-64 overflow-y-auto bg-card shadow-sm mt-2">
                  {isLoading ? (
                    <div className="p-8 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {geoloading && !search && (
                        <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" /> Hämtar din plats...
                        </div>
                      )}
                      
                      {geoSuggestion && !search && (
                        <button
                          className="w-full text-left px-4 py-3 text-sm hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 border-b-2 border-blue-100 dark:border-blue-900/50"
                          onClick={() => {
                             const m = municipalities?.find(x => x.id === geoSuggestion.id);
                             if (m) handleSelectMuni(m);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span><strong className="text-blue-800 dark:text-blue-300">Din plats:</strong> {geoSuggestion.name}</span>
                          </div>
                          <span className="text-xs text-blue-600/70 dark:text-blue-400/70">
                            {municipalities?.find(x => x.id === geoSuggestion.id)?.regionName}
                          </span>
                        </button>
                      )}

                      {filteredMuni.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Inga kommuner hittades
                        </div>
                      ) : (
                        filteredMuni.map((muni) => (
                          <button
                            key={muni.id}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
                            onClick={() => handleSelectMuni(muni)}
                          >
                            <span>{muni.name}</span>
                            <span className="text-xs text-muted-foreground">{muni.regionName}</span>
                          </button>
                        ))
                      )}
                    </>
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
