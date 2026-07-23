import { useState, useMemo } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useListMunicipalities, QuizPayloadLevel } from '@workspace/api-client-react';
import { useAppStore } from '@/hooks/use-local-answers';
import { MapPin, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function LevelIntro() {
  const { level } = useParams<{ level: string }>();
  const [, setLocation] = useLocation();
  const validLevel = level as QuizPayloadLevel;
  
  const { municipalityId, setMunicipalityId } = useAppStore();
  const { data: municipalities, isLoading } = useListMunicipalities({ query: { queryKey: ['municipalities'] } });
  
  const [search, setSearch] = useState('');
  
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

          <div className="pt-6">
            <Button 
              size="lg" 
              className="w-full text-lg h-14" 
              onClick={handleStart}
              disabled={needsMunicipality && !municipalityId}
            >
              Starta Valkompass <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
