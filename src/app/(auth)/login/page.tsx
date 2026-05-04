"use client";

// 'use client' aqui porque precisamos de:
// - useState para controlar os campos do formulário e estados de loading/erro
// - Eventos de clique e submit (interatividade)
// Se fosse só exibir dados estáticos, seria Server Component sem esse directive

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  // Estado do formulário de email/senha
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // impede o browser de recarregar a página no submit
    setLoading(true);
    setError(null); // limpa erros anteriores antes de tentar novamente

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Nunca expomos a mensagem técnica do Supabase diretamente ao usuário
      // Traduzimos para algo que faça sentido na interface
      setError("Email ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    // window.location.href força um request HTTP completo ao invés de
    // navegação client-side — necessário para o middleware ler os
    // cookies de sessão recém-criados e liberar o acesso ao dashboard
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Cabeçalho */}
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
          <p className="text-sm text-muted-foreground">
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Botões OAuth — ficam acima do formulário, é o padrão UX atual
            (Gmail, Notion, Linear e outros todos seguem essa ordem) */}
        <div className="space-y-2">
          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-md border
               border-input bg-background px-4 py-2 text-sm font-medium
               hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </a>

          <a
            href="/api/auth/github"
            className="flex w-full items-center justify-center gap-3 rounded-md border
               border-input bg-background px-4 py-2 text-sm font-medium
               hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continuar com GitHub
          </a>
        </div>

        {/* Divisor visual entre OAuth e formulário tradicional
            É um padrão de UI chamado "divider with label" */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Formulário tradicional de email e senha */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {/* htmlFor no label deve sempre bater com o id do input
                Isso conecta os dois semanticamente — clicar no label
                foca o input, e leitores de tela entendem a relação */}
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2
                         focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            {/* Label e link "Esqueci minha senha" ficam na mesma linha
                usando flexbox com justify-between */}
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2
                         focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            />
          </div>

          {/* Renderização condicional — o bloco de erro só aparece
              quando a string error não é null nem vazia
              É uma boa prática não reservar espaço fixo para mensagens de erro */}
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading} // Desabilita o botão durante o processo de login
            // Desabilitamos durante qualquer carregamento — email/senha ou OAuth
            // Evita duplo submit acidental
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium
                       text-primary-foreground hover:bg-primary/90 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Link para quem ainda não tem conta */}
        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
