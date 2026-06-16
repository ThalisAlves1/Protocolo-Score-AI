-- Protocolo Score AI - Supabase setup
-- Cole este arquivo no Supabase SQL Editor e clique em Run.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.clinical_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  protocol text not null check (protocol in ('NEWS2', 'MEOWS', 'PEWS')),
  difficulty text not null default 'MEDIO' check (difficulty in ('FACIL', 'MEDIO', 'DIFICIL')),
  stem text not null,
  vital_signs jsonb not null default '{}'::jsonb,
  answer_key jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid null,
  student_name text null,
  case_id uuid not null references public.clinical_cases(id) on delete cascade,
  answer jsonb not null,
  grading jsonb not null,
  total_score integer not null,
  max_score integer not null,
  feedback text not null,
  created_at timestamptz not null default now()
);

create index if not exists clinical_cases_active_created_at_idx on public.clinical_cases(active, created_at desc);
create index if not exists attempts_case_id_created_at_idx on public.attempts(case_id, created_at desc);
create index if not exists attempts_student_name_created_at_idx on public.attempts(student_name, created_at desc);

drop trigger if exists set_clinical_cases_updated_at on public.clinical_cases;
create trigger set_clinical_cases_updated_at
before update on public.clinical_cases
for each row execute function public.set_updated_at();

-- Segurança: a aplicação usa a service_role key somente no servidor.
-- Sem policies públicas, o navegador não consegue consultar/alterar dados direto.
alter table public.clinical_cases enable row level security;
alter table public.attempts enable row level security;

-- Casos de demonstração. Pode apagar depois.
insert into public.clinical_cases (id, title, protocol, difficulty, stem, vital_signs, answer_key, active)
values
(
  '11111111-1111-1111-1111-111111111111',
  'NEWS2 - Adulto com desconforto respiratório',
  'NEWS2',
  'MEDIO',
  'Paciente masculino, 68 anos, chega ao pronto atendimento com dispneia, febre e sonolência. O objetivo é calcular o escore e definir o nível de risco conforme o gabarito institucional.',
  $$
  {
    "Frequência respiratória": "28 irpm",
    "SpO2": "90%",
    "Oxigênio suplementar": "Sim",
    "PA sistólica": "92 mmHg",
    "Frequência cardíaca": "118 bpm",
    "Temperatura": "38,4 ºC",
    "Consciência": "Confuso"
  }
  $$::jsonb,
  $$
  {
    "items": [
      { "key": "fr", "label": "Frequência respiratória", "correctScore": 3, "explanation": "FR elevada no caso." },
      { "key": "spo2", "label": "Saturação de oxigênio", "correctScore": 3, "explanation": "Saturação reduzida." },
      { "key": "oxigenio", "label": "Oxigênio suplementar", "correctScore": 2, "explanation": "Uso de oxigênio suplementar." },
      { "key": "pa", "label": "Pressão arterial sistólica", "correctScore": 3, "explanation": "Pressão sistólica baixa." },
      { "key": "fc", "label": "Frequência cardíaca", "correctScore": 2, "explanation": "Taquicardia." },
      { "key": "temp", "label": "Temperatura", "correctScore": 1, "explanation": "Febre." },
      { "key": "consciencia", "label": "Nível de consciência", "correctScore": 3, "explanation": "Alteração do nível de consciência." }
    ],
    "totalScore": 17,
    "riskLevel": "alto risco",
    "expectedConduct": "Acionar avaliação imediata, monitorizar o paciente e seguir o fluxo institucional de escalonamento.",
    "explanation": "O caso reúne alteração respiratória, hipotensão, febre e alteração neurológica, justificando alto risco."
  }
  $$::jsonb,
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  'MEOWS - Puérpera com sinais de alerta',
  'MEOWS',
  'DIFICIL',
  'Puérpera no 2º dia pós-parto refere mal-estar, tontura e falta de ar leve. Avalie os parâmetros apresentados e defina a classificação conforme o gabarito do caso.',
  $$
  {
    "Frequência respiratória": "24 irpm",
    "SpO2": "94%",
    "PA sistólica": "88 mmHg",
    "PA diastólica": "56 mmHg",
    "Frequência cardíaca": "126 bpm",
    "Temperatura": "38,1 ºC",
    "Consciência": "Alerta, porém prostrada"
  }
  $$::jsonb,
  $$
  {
    "items": [
      { "key": "fr", "label": "Frequência respiratória", "correctScore": 2, "explanation": "Respiração acima do esperado." },
      { "key": "spo2", "label": "Saturação de oxigênio", "correctScore": 1, "explanation": "Saturação limítrofe." },
      { "key": "pas", "label": "Pressão arterial sistólica", "correctScore": 3, "explanation": "Hipotensão sistólica." },
      { "key": "pad", "label": "Pressão arterial diastólica", "correctScore": 1, "explanation": "Diastólica baixa." },
      { "key": "fc", "label": "Frequência cardíaca", "correctScore": 3, "explanation": "Taquicardia importante." },
      { "key": "temp", "label": "Temperatura", "correctScore": 1, "explanation": "Febre." },
      { "key": "consciencia", "label": "Estado neurológico", "correctScore": 0, "explanation": "Alerta, sem alteração neurológica objetiva no gabarito." }
    ],
    "totalScore": 11,
    "riskLevel": "alto risco obstétrico",
    "expectedConduct": "Comunicar equipe responsável imediatamente, repetir avaliação conforme protocolo e considerar escalonamento obstétrico.",
    "explanation": "A combinação de hipotensão e taquicardia em puérpera exige reconhecimento rápido de risco."
  }
  $$::jsonb,
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  'PEWS - Criança com piora respiratória',
  'PEWS',
  'MEDIO',
  'Criança de 4 anos chega com tosse, retrações leves e irritabilidade. Analise os dados e responda à pontuação do caso.',
  $$
  {
    "Frequência respiratória": "42 irpm",
    "Esforço respiratório": "Retrações leves",
    "SpO2": "92%",
    "Oxigênio suplementar": "Não",
    "Frequência cardíaca": "142 bpm",
    "Perfusão": "TEC 3 segundos",
    "Comportamento": "Irritada, consolável"
  }
  $$::jsonb,
  $$
  {
    "items": [
      { "key": "fr", "label": "Frequência respiratória", "correctScore": 2, "explanation": "FR elevada para o caso proposto." },
      { "key": "esforco", "label": "Esforço respiratório", "correctScore": 1, "explanation": "Retrações leves." },
      { "key": "spo2", "label": "Saturação de oxigênio", "correctScore": 2, "explanation": "Saturação reduzida." },
      { "key": "oxigenio", "label": "Oxigênio suplementar", "correctScore": 0, "explanation": "Não está em oxigênio." },
      { "key": "fc", "label": "Frequência cardíaca", "correctScore": 2, "explanation": "Taquicardia." },
      { "key": "perfusao", "label": "Perfusão", "correctScore": 1, "explanation": "TEC aumentado." },
      { "key": "comportamento", "label": "Comportamento", "correctScore": 1, "explanation": "Irritada, mas consolável." }
    ],
    "totalScore": 9,
    "riskLevel": "risco moderado/alto",
    "expectedConduct": "Reavaliar em curto intervalo, comunicar equipe e seguir fluxo institucional pediátrico.",
    "explanation": "Há sinais respiratórios e circulatórios que indicam necessidade de vigilância e escalonamento."
  }
  $$::jsonb,
  true
)
on conflict (id) do update set
  title = excluded.title,
  protocol = excluded.protocol,
  difficulty = excluded.difficulty,
  stem = excluded.stem,
  vital_signs = excluded.vital_signs,
  answer_key = excluded.answer_key,
  active = excluded.active,
  updated_at = now();
