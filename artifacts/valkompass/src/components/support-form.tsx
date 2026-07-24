import { useState } from 'react';
import { useCreateSupportMessage } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';

export function SupportForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot — osynligt fält mot robotar
  const [error, setError] = useState<string | null>(null);
  const create = useCreateSupportMessage();

  if (sent) {
    return (
      <div className="not-prose flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-4 my-6">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-green-800 dark:text-green-200">Tack för ditt meddelande!</p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Vi läser alla meddelanden och återkommer så snart vi kan om du angett en e-postadress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      className="not-prose space-y-4 my-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (message.trim().length < 10) {
          setError('Skriv gärna lite mer – minst 10 tecken.');
          return;
        }
        create.mutate(
          {
            data: {
              name: name.trim() || undefined,
              email: email.trim() || undefined,
              message: message.trim(),
              ...(website ? { website } : {}),
            } as Parameters<typeof create.mutate>[0]['data'],
          },
          {
            onSuccess: () => setSent(true),
            onError: () => setError('Något gick fel. Försök igen om en stund.'),
          }
        );
      }}
    >
      <div className="hidden" aria-hidden="true">
        <label htmlFor="support-website">Webbplats</label>
        <input
          id="support-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="support-name" className="text-sm font-medium">Namn (frivilligt)</label>
          <Input id="support-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Ditt namn" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="support-email" className="text-sm font-medium">E-post (frivilligt, om du vill ha svar)</label>
          <Input id="support-email" type="email" value={email} maxLength={200} onChange={(e) => setEmail(e.target.value)} placeholder="din@epost.se" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="support-message" className="text-sm font-medium">Meddelande</label>
        <Textarea
          id="support-message"
          value={message}
          maxLength={4000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Beskriv din fråga, felrapport eller synpunkt..."
          rows={6}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Skickar…' : 'Skicka meddelande'}
      </Button>
    </form>
  );
}
