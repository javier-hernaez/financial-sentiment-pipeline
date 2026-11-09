'use client';

import { Button } from '@/components/ui';
import { LocaleProvider, useLocale } from '@/lib/i18n';

function ErrorMessage({ reset }: { reset: () => void }) {
  const { t } = useLocale();
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col items-start justify-center gap-4 px-6">
      <h1 className="display text-[32px]">{t('Algo ha fallado en esta página.', 'Something went wrong on this page.')}</h1>
      <p className="text-ink-2">{t('Los datos no se han visto afectados.', 'The data has not been affected.')}</p>
      <Button variant="primary" onClick={reset}>
        {t('Reintentar', 'Try again')}
      </Button>
    </main>
  );
}

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <LocaleProvider>
      <ErrorMessage reset={reset} />
    </LocaleProvider>
  );
}
