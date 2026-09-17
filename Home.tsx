import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { Button } from '../components/ui/Button'

export function Home() {
  const { user } = useAuthStore()

  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4">
            Guarda-roupa digital
          </p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.1] text-ink-900 mb-6">
            Vista-se com<br />intenção.
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed mb-10 max-w-lg">
            Cadastre suas peças, informe a ocasião e a temperatura.
            O Kloset monta combinações coerentes e aprende com o que você realmente usa.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <Link to="/generate">
                  <Button>Gerar look</Button>
                </Link>
                <Link to="/wardrobe">
                  <Button variant="secondary">Meu guarda-roupa</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button>Começar</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary">Já tenho conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 pb-24 border-t border-ink-100 pt-16">
        <div>
          <h3 className="font-display text-xl text-ink-900 mb-2">Cadastro simples</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Fotografe as peças em diferentes ângulos. O sistema organiza por categoria, cor e estilo.
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl text-ink-900 mb-2">Clima e ocasião</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Informe onde você está e o que vai fazer. As sugestões respeitam temperatura e contexto.
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl text-ink-900 mb-2">Aprendizado real</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Avalie os looks. Com o tempo, as combinações passam a refletir o seu gosto — não o de uma tendência genérica.
          </p>
        </div>
      </section>
    </div>
  )
}
