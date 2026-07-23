import { Layout } from '@/components/layout';
import { useLocation } from 'wouter';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Sidan hittades inte</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Vi kunde inte hitta sidan du letade efter. Den kan ha tagits bort eller så är adressen felaktig.
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => setLocation('/')}>Gå till startsidan</Button>
          <Button size="lg" variant="outline" onClick={() => window.history.back()}>Gå tillbaka</Button>
        </div>
      </div>
    </Layout>
  );
}
