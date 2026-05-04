'use client'

// 'use client' necessário para useState e eventos do formulário

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validação mínima no client — apenas para UX imediata
    // A validação completa com Zod virá nas API Routes
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Dados extras salvos nos metadados do usuário no Supabase
        // Acessíveis depois via user.user_metadata.name
        data: { name },
      },
    })

    if (error) {
      // 'already registered' é a mensagem do Supabase para email duplicado
      // Traduzimos para linguagem do usuário em vez de expor o erro técnico
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado. Tente fazer login.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
      setLoading(false)
      return
    }

    // Após cadastro bem-sucedido o Supabase já cria a sessão automaticamente.
    // window.location.href força um request HTTP completo — necessário para
    // o middleware ler os cookies de sessão recém-criados
    window.location.href = '/dashboard'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/logo-light-transparent.svg"
              alt="Finance Control"
              width={400}
              height={116}
              className="block dark:hidden"
            />
            <img
              src="/logo-dark-transparent.svg"
              alt="Finance Control"
              width={400}
              height={116}
              className="hidden dark:block"
            />
          </div>
          <p className="text-sm text-muted-foreground">Crie sua conta gratuitamente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Nome</label>
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2
                         focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2
                         focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2
                         focus:ring-ring focus:ring-offset-2"
            />
          </div>

          {/* Erro só aparece quando existe — não reserva espaço fixo na tela */}
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium
                       text-primary-foreground hover:bg-primary/90 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>

      </div>
    </div>
  )
}