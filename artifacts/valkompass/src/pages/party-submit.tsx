import { useMemo, useState } from 'react';
import {
  useListMunicipalities,
  getQuiz,
  QuizPayload,
  QuizPayloadLevel,
} from '@workspace/api-client-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Mail } from 'lucide-react';
import { Layout } from '@/components/layout';

const LEVELS: { value: QuizPayloadLevel; label: string }[] = [
  { value: 'kommun', label: 'Kommunval' },
  { value: 'region', label: 'Regionval' },
  { value: 'riksdag', label: 'Riksdagsval' },
];

const SCALE: { value: number; label: string }[] = [
  { value: 2, label: 'Håller helt med' },
  { value: 1, label: 'Håller delvis med' },
  { value: -1, label: 'Tar delvis avstånd' },
  { value: -2, label: 'Tar helt avstånd' },
];

export default function PartySubmit() {
  const [level, setLevel] = useState<QuizPayloadLevel>('kommun');
  const [municipalityId, setMunicipalityId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: municipalities } = useListMunicipalities({
    query: { queryKey: ['municipalities'] },
  });

  const needsMunicipality = level !== 'riksdag';
  const quizEnabled = !needsMunicipality || !!municipalityId;
  const { data: quiz } = useQuery<QuizPayload>({
    queryKey: ['party-submit-quiz', level, municipalityId],
    queryFn: () =>
      getQuiz(level, needsMunicipality ? { municipalityId } : undefined),
    enabled: quizEnabled,
  });

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v != null).length,
    [answers],
  );
  const threshold = quiz ? Math.ceil(quiz.questions.length * 0.4) : 0;

  if (sent) {
    return (
      <Layout>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-6">
          <Mail className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">
              Nästan klart – kolla din e-post!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Vi har skickat en bekräftelselänk till <strong>{email}</strong>.
              Klicka på länken i mejlet för att bekräfta svaren. Om din
              e-postadress har partiets egen domän publiceras svaren direkt,
              annars granskas de manuellt först.
            </p>
          </div>
        </div>
      </div>
      </Layout>
    );
  }

  return (
    <Layout>
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Lämna ert partis svar</h1>
      <p className="text-muted-foreground mb-6">
        Här kan företrädare för ett parti skicka in partiets egna svar på
        valkompassens frågor. Svaren bekräftas via e-post: kommer mejlet från
        partiets egen webbdomän publiceras svaren automatiskt, annars granskas
        de manuellt. Partiets egna svar ersätter våra redaktionella
        bedömningar och märks som &quot;Partiets eget svar&quot;.
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Val</label>
          <div className="flex gap-2 flex-wrap">
            {LEVELS.map((l) => (
              <Button
                key={l.value}
                type="button"
                variant={level === l.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLevel(l.value);
                  setPartyId('');
                  setAnswers({});
                }}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>

        {needsMunicipality && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="muni">
              Kommun
            </label>
            <select
              id="muni"
              className="w-full border rounded-md px-3 py-2 bg-background"
              value={municipalityId}
              onChange={(e) => {
                setMunicipalityId(e.target.value);
                setPartyId('');
                setAnswers({});
              }}
            >
              <option value="">Välj kommun…</option>
              {municipalities?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {quiz && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="party">
              Parti
            </label>
            <select
              id="party"
              className="w-full border rounded-md px-3 py-2 bg-background"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
            >
              <option value="">Välj parti…</option>
              {quiz.parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {quiz && partyId && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (!email.trim()) {
              setError('Ange en e-postadress.');
              return;
            }
            if (answeredCount === 0) {
              setError('Besvara minst en fråga.');
              return;
            }
            setSending(true);
            try {
              const res = await fetch('/api/party-submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  partyId,
                  level,
                  municipalityId: needsMunicipality ? municipalityId : null,
                  contactName: contactName.trim() || null,
                  email: email.trim(),
                  answers,
                  ...(website ? { website } : {}),
                }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                setError(data.message ?? 'Något gick fel. Försök igen.');
              } else {
                setSent(true);
              }
            } catch {
              setError('Något gick fel. Försök igen.');
            } finally {
              setSending(false);
            }
          }}
        >
          <div className="rounded-lg border bg-muted/40 p-4 mb-6 text-sm text-muted-foreground">
            Besvara så många frågor ni kan. Med minst {threshold} av{' '}
            {quiz.questions.length} besvarade frågor får partiet en
            matchningsprocent i valkompassen. Hittills besvarade:{' '}
            <strong>{answeredCount}</strong>.
          </div>

          <ol className="space-y-6">
            {quiz.questions.map((q, i) => (
              <li key={q.id} className="border rounded-lg p-4">
                <p className="font-medium mb-1">
                  {i + 1}. {q.text}
                </p>
                {q.explanation && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {q.explanation}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {SCALE.map((s) => (
                    <Button
                      key={s.value}
                      type="button"
                      size="sm"
                      variant={answers[q.id] === s.value ? 'default' : 'outline'}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: prev[q.id] === s.value ? null : s.value,
                        }))
                      }
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cname">
                Ditt namn (valfritt)
              </label>
              <Input
                id="cname"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Förnamn Efternamn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cemail">
                Din e-postadress
              </label>
              <Input
                id="cemail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@partietsdoman.se"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Använd helst en adress på partiets egen domän – då publiceras
                svaren automatiskt efter bekräftelsen.
              </p>
            </div>
            {/* Honeypot – osynligt fält mot robotar */}
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={sending}>
              {sending ? 'Skickar…' : 'Skicka in svaren'}
            </Button>
          </div>
        </form>
      )}
    </div>
    </Layout>
  );
}

export function PartySubmitVerify() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const { data, isLoading, isError } = useQuery<{ status: string }>({
    queryKey: ['party-submit-verify', token],
    queryFn: async () => {
      const res = await fetch(
        `/api/party-submissions/verify?token=${encodeURIComponent(token)}`,
      );
      if (!res.ok) throw new Error('invalid');
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  return (
    <Layout>
    <div className="max-w-2xl mx-auto px-4 py-16">
      {isLoading && <p>Bekräftar…</p>}
      {(isError || !token) && (
        <p className="text-destructive">
          Länken är ogiltig eller redan använd.
        </p>
      )}
      {data?.status === 'approved' && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-6">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">
              Tack! Svaren är bekräftade och publicerade.
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Partiets svar visas nu i valkompassen, märkta som partiets egna
              svar.
            </p>
          </div>
        </div>
      )}
      {data?.status === 'pending_review' && (
        <div className="rounded-lg border p-6">
          <p className="font-semibold">Tack! Svaren väntar på granskning.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Eftersom e-postadressen inte har partiets egen webbdomän granskas
            svaren manuellt innan de publiceras. Det sker normalt inom några
            dagar.
          </p>
        </div>
      )}
    </div>
    </Layout>
  );
}
