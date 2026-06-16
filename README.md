# Protocolo Score AI — versão Supabase

Plataforma profissional de simulação clínica para treinamento dos protocolos NEWS2, MEOWS e PEWS/PEOWS.

O aluno responde casos clínicos, o sistema corrige por gabarito estruturado e a IA gera feedback educacional sobre erros, acertos e pontos de melhoria.

> Uso exclusivamente educacional. Não utilizar para diagnóstico, prescrição, triagem real, decisão clínica ou substituição de avaliação por profissional habilitado.

## Stack

- Next.js com App Router
- TypeScript
- Supabase/PostgreSQL
- Supabase JavaScript Client no servidor
- Feedback por IA usando Gemini API
- Envio opcional do feedback por e-mail usando Resend

## O que mudou nesta versão

Esta versão remove Docker, Prisma e banco PostgreSQL local.

Agora o banco fica no Supabase. Você só precisa:

1. Criar um projeto no Supabase.
2. Colar o SQL de `supabase/setup.sql` no SQL Editor.
3. Colocar as chaves do Supabase no `.env`.
4. Rodar `npm run dev`.

## Como configurar o Supabase

### 1. Crie o projeto

Acesse o Supabase e crie um novo projeto.

### 2. Rode o SQL

No painel do Supabase:

```text
SQL Editor > New query
```

Cole todo o conteúdo do arquivo:

```text
supabase/setup.sql
```

Depois clique em **Run**.

Esse SQL cria:

- tabela `clinical_cases`;
- tabela `attempts`;
- índices;
- RLS habilitado;
- 3 casos de demonstração.

### 3. Configure o `.env`

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, pode usar:

```powershell
copy .env.example .env
```

Preencha:

```env
SUPABASE_URL="https://SEU-PROJETO.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
ADMIN_PASSWORD="admin123"
ADMIN_SESSION_SECRET="troque-por-um-segredo-longo-e-aleatorio"
RESEND_API_KEY=""
FEEDBACK_EMAIL_FROM="Protocolo Score AI <onboarding@resend.dev>"
FEEDBACK_EMAIL_REPLY_TO=""
```

Onde encontrar:

```text
Supabase > Project Settings > Data API > Project URL
Supabase > Project Settings > API Keys > service_role / secret key
```

Importante: a `SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para componente client-side, navegador ou repositório público. Neste projeto ela é usada apenas em rotas e páginas server-side.


### 4. Configure a API do Gemini

No Google AI Studio, crie uma API key e coloque no `.env`:

```env
GEMINI_API_KEY="sua-chave-do-gemini"
GEMINI_MODEL="gemini-2.5-flash"
ADMIN_PASSWORD="admin123"
ADMIN_SESSION_SECRET="troque-por-um-segredo-longo-e-aleatorio"
```

Se deixar `GEMINI_API_KEY` vazia, a plataforma continua funcionando, mas o feedback será local e básico.

### 5. Configure o envio de e-mail

Esta versão envia o feedback para o e-mail informado pelo aluno usando a API do Resend.

Crie uma conta no Resend, gere uma API key e configure no `.env`:

```env
RESEND_API_KEY="sua-chave-do-resend"
FEEDBACK_EMAIL_FROM="Protocolo Score AI <feedback@seudominio.com>"
FEEDBACK_EMAIL_REPLY_TO="contato@seudominio.com"
```

Para produção, use um remetente de domínio verificado no Resend. Se `RESEND_API_KEY` ou `FEEDBACK_EMAIL_FROM` ficarem vazios, o teste continua funcionando normalmente, mas o e-mail não será enviado.

### 6. Instale e rode

```bash
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Rotas principais

```text
/               Página inicial
/casos          Lista de casos para o aluno responder
/teste/[id]     Tela de resposta do caso
/resultado/[id] Resultado, correção e feedback
/admin          Entrada/login do administrador
/admin/casos    Cadastro de casos por JSON protegido por senha
```

## Fluxo do aluno

1. Acessa a lista de casos.
2. Escolhe um caso clínico.
3. Preenche nome, e-mail, protocolo, pontuações por item, total, risco, conduta e justificativa.
4. O sistema compara com o gabarito.
5. A IA gera um feedback didático.
6. Se o aluno informou e-mail e o Resend está configurado, o feedback é enviado automaticamente.

## Fluxo do professor/admin

Acesse:

```text
/admin
```

Entre com a senha definida no arquivo `.env` em:

```env
ADMIN_PASSWORD="sua-senha"
```

Depois de entrar, a plataforma redireciona para:

```text
/admin/casos
```

Cole um caso no formato JSON e salve no banco. A rota de cadastro também valida a sessão admin antes de aceitar novos casos.

## Modelo de caso clínico

```json
{
  "title": "Caso NEWS2 - desconforto respiratório",
  "protocol": "NEWS2",
  "difficulty": "MEDIO",
  "stem": "Paciente adulto chega ao pronto atendimento com dispneia, sonolência e febre.",
  "vitalSigns": {
    "Frequência respiratória": "28 irpm",
    "SpO2": "90%",
    "Oxigênio suplementar": "Sim",
    "PA sistólica": "92 mmHg",
    "Frequência cardíaca": "118 bpm",
    "Temperatura": "38,5 ºC",
    "Consciência": "Confuso"
  },
  "answerKey": {
    "items": [
      {
        "key": "fr",
        "label": "Frequência respiratória",
        "correctScore": 3,
        "explanation": "Taquipneia importante."
      }
    ],
    "totalScore": 17,
    "riskLevel": "alto risco",
    "expectedConduct": "Acionar avaliação imediata, monitorização e escalonamento conforme protocolo institucional.",
    "explanation": "Caso de alto risco por instabilidade respiratória, hemodinâmica e alteração de consciência."
  }
}
```

## Por que o gabarito é estruturado?

NEWS2, MEOWS e PEWS/PEOWS têm variações institucionais, principalmente MEOWS e PEWS. Por isso, a plataforma não força uma tabela única. O professor cadastra o gabarito oficial da instituição e o sistema corrige exatamente com base nele.

## Segurança

- O projeto usa Supabase no servidor com `service_role`.
- A área `/admin/casos` fica protegida por senha simples via cookie HTTP-only para o MVP.
- As tabelas estão com RLS habilitado.
- Não há política pública liberando acesso direto do navegador.
- A IA não recalcula a nota: ela apenas explica a correção feita pelo sistema.
- A plataforma é educacional e não deve ser usada para decisão clínica real.

## Próximos módulos recomendados

- Login real com Supabase Auth.
- Perfis de aluno, professor e admin.
- Importação em massa por CSV/Excel.
- Turmas e vínculo aluno-professor.
- Relatórios por aluno, turma, protocolo e erro mais frequente.
- Certificado automático por nota mínima.
- Temporizador de simulado.
- Questões discursivas com rubrica.
- Exportação de relatório em PDF.

## Estrutura principal

```text
src/app                     Telas e rotas Next.js
src/components              Componentes visuais
src/lib/supabaseAdmin.ts    Cliente Supabase usado somente no servidor
src/lib/db.ts               Conversão entre banco e UI
src/lib/grading.ts          Motor de correção objetiva
src/lib/aiFeedback.ts       Integração com Gemini API
src/lib/email.ts            Envio de feedback por e-mail via Resend API
src/lib/adminAuth.ts        Autenticação simples do admin do MVP
supabase/setup.sql          SQL para criar tabelas e casos de demonstração
```
