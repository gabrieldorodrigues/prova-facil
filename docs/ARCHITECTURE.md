# 🏗 Arquitetura Técnica — Prova Fácil

Documento técnico detalhado do MVP. Para visão geral do produto, ver [README](../README.md). Para uso pelo professor, ver [Manual do Professor](USER_GUIDE.md).

---

## Sumário

1. [Decisões arquiteturais](#1-decisões-arquiteturais)
2. [Camadas e responsabilidades](#2-camadas-e-responsabilidades)
3. [Modelo de dados](#3-modelo-de-dados)
4. [Integração com Gemini Vision](#4-integração-com-gemini-vision)
5. [Cálculo de nota](#5-cálculo-de-nota)
6. [Persistência local](#6-persistência-local)
7. [Exportação CSV](#7-exportação-csv)
8. [Sistema de tema](#8-sistema-de-tema)
9. [Navegação](#9-navegação)
10. [Tratamento de erros](#10-tratamento-de-erros)
11. [Riscos e mitigações](#11-riscos-e-mitigações)

---

## 1. Decisões arquiteturais

### Por que Expo (managed workflow)?

| Critério | Bare React Native | Expo Managed |
|---|---|---|
| Tempo até o "primeiro hello world" | dias (Xcode, Android Studio) | minutos (Expo Go) |
| Necessário Mac para iOS? | sim | não (Expo Go faz o build) |
| Atualização OTA | manual | embutido |
| Acesso a módulos nativos | total | limitado ao Expo SDK |

Como o MVP **não exige módulos nativos exóticos** (apenas câmera, galeria, file system), o managed workflow é o melhor custo-benefício.

### Por que Gemini Vision e não OpenCV/ML Kit?

OpenCV e Google ML Kit precisam de código nativo, **incompatível com Expo Go**. As opções viáveis para detectar marcações em fotos via JavaScript puro:

1. **Tesseract.js** – ~30MB, lento (>10s por foto), preciso só com layout regular.
2. **API de visão multimodal** (GPT-4o, Gemini, Claude) – algumas centenas de KB de código, ~3–8s, alta precisão em layouts livres.
3. **Marcações estilo "bubble sheet"** com OpenCV – exige template fixo, formulário pré-impresso, e prebuild com módulo nativo.

A API de visão venceu por:
- **Não exige template fixo** – professor pode usar qualquer prova existente.
- **Lida com rasuras, marcações múltiplas, variações de caligrafia** com instrução em linguagem natural.
- **Retorna JSON estruturado** via `responseSchema` – zero parsing frágil.
- **Custo desprezível** no tier gratuito do Gemini para uso pessoal.

### Por que Gemini 3.1 Flash Lite especificamente?

| Modelo | Latência | Custo (entrada) | Qualidade vision | Tier gratuito |
|---|---|---|---|---|
| Gemini 3.1 Flash Lite | ~2-4s | mais barato da família | suficiente para o caso | sim (15 RPM) |
| Gemini 3.x Pro | ~8-15s | 5x mais caro | melhor para imagens complexas | não |
| GPT-4o | ~5-10s | 5x mais caro | excelente | não |

Para detectar marcações em alternativas (tarefa relativamente simples), o Flash Lite oferece a **melhor relação latência/custo** sem sacrificar precisão.

### Por que AsyncStorage e não SQLite/Realm?

- O modelo de dados é **simples** (duas coleções: provas e correções).
- O volume é **baixo** (centenas de registros por professor).
- AsyncStorage é **chave-valor** já incluído no Expo, zero configuração.
- Para Fase 3 (relatórios complexos, queries), SQLite via `expo-sqlite` será adicionado.

### Por que React Native Paper?

- Componentes Material 3 prontos (TextInput, Button, Dialog, Snackbar).
- Tema customizável por design tokens.
- Acessibilidade decente "out of the box".
- Bundle pequeno comparado a NativeBase/Tamagui para o uso que fazemos.

---

## 2. Camadas e responsabilidades

### `src/screens/` – Camada de tela
Cada arquivo é uma "página" da aplicação. Responsabilidade: orquestrar componentes, chamar serviços, gerenciar estado local de UI. Não contém lógica de negócio.

### `src/components/` – Componentes reutilizáveis
- `AnswerCell` – célula clicável com 5 variantes (default, selected, correct, wrong, unknown).
- `QuestionRow` – editor completo de uma questão (tipo + resposta + peso).
- `StatCard` – card de métrica com label, valor e hint.
- `ScoreBadge` – badge da nota com cor automática conforme valor.
- `EmptyState` – estado vazio com emoji + título + descrição + CTA opcional.
- `SectionHeader` – cabeçalho de seção com tipografia consistente.

### `src/services/` – Camada de integração
Cada serviço encapsula uma fonte externa de dados:
- `storage.ts` – AsyncStorage.
- `geminiVision.ts` – API HTTP do Google Gemini.
- `csvExport.ts` – sistema de arquivos + Share Sheet.

### `src/utils/` – Funções puras
- `grading.ts` – lógica de cálculo de nota e validação de resposta.

### `src/types/` – Tipos TypeScript compartilhados
Single source of truth para `Exam`, `Question`, `Correction`.

### `src/theme.ts` – Design tokens
Centraliza cores, espaçamentos, raios e elevações para consistência visual.

---

## 3. Modelo de dados

```typescript
type QuestionType = 'mc5' | 'mc4' | 'tf';

interface Question {
  id: string;              // UUID
  number: number;          // 1..N
  type: QuestionType;
  correctAnswer: string;   // 'A'..'E' | 'A'..'D' | 'V' | 'F'
  weight: number;
}

interface Exam {
  id: string;
  name: string;
  className: string;
  createdAt: string;       // ISO 8601
  questions: Question[];
}

interface Correction {
  id: string;
  examId: string;
  studentName: string;
  photoUris: string[];
  detectedAnswers: Record<string, string>;  // questionId → resposta
  score: number;           // 0-10, 1 casa decimal
  hits: number;
  misses: number;
  correctedAt: string;     // ISO 8601
}
```

### Decisões

- **IDs por UUID** (via `expo-crypto`), não autoincrement, para suportar múltiplos dispositivos no futuro sem colisão.
- **`number` separado do `id`** – número da questão é apresentação, ID é identidade. Permite reordenar questões mantendo histórico de correções.
- **`detectedAnswers` como `Record<string, string>`** – usa o ID da questão como chave, robusto a reordenação.
- **`score` denormalizado** – armazena o resultado calculado para evitar recalcular ao listar correções (e mantê-lo estável caso o gabarito seja editado no futuro).

---

## 4. Integração com Gemini Vision

### Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}
```

Modelo padrão: `gemini-3.1-flash-lite` (configurável via `EXPO_PUBLIC_GEMINI_MODEL`).

### Pipeline

```
URI da foto local
       │
       ▼
┌────────────────────────────────────────┐
│ ImageManipulator.manipulateAsync       │
│ - resize: { width: 1024 }              │
│ - compress: 0.7                        │
│ - format: JPEG                         │
│ - base64: true                         │
└────────────┬───────────────────────────┘
             │ string base64
             ▼
┌────────────────────────────────────────┐
│ Build request body:                    │
│ {                                      │
│   contents: [{                         │
│     parts: [                           │
│       { text: PROMPT },                │
│       { inline_data: {                 │
│           mime_type: "image/jpeg",     │
│           data: BASE64                 │
│       } }                              │
│     ]                                  │
│   }],                                  │
│   generationConfig: {                  │
│     responseMimeType: "application/json│
│     responseSchema: { ... },           │
│     temperature: 0                     │
│   }                                    │
│ }                                      │
└────────────┬───────────────────────────┘
             │ POST
             ▼
┌────────────────────────────────────────┐
│ Gemini API                             │
└────────────┬───────────────────────────┘
             │ JSON
             ▼
┌────────────────────────────────────────┐
│ JSON.parse(candidates[0]                │
│   .content.parts[0].text)              │
│ → { answers: [{ questionNumber, marked }]}│
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Validação:                             │
│ - questionNumber existe na prova?      │
│ - marked está em getOptionsForType()?  │
│ - se inválido → '?'                    │
└────────────┬───────────────────────────┘
             │
             ▼
       Record<questionId, resposta>
```

### Por que `responseSchema`?

Sem schema, modelos podem retornar JSON com formatos variados, comentários, markdown wrapper. Com `responseMimeType: "application/json"` e `responseSchema`, o Gemini garante:

1. Saída válida em JSON (sem ` ```json ... ``` ` envoltório).
2. Estrutura conforme schema (campos obrigatórios, tipos corretos).
3. Comportamento determinístico (com `temperature: 0`).

Schema usado:

```json
{
  "type": "object",
  "properties": {
    "answers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "questionNumber": { "type": "integer" },
          "marked": { "type": "string" }
        },
        "required": ["questionNumber", "marked"]
      }
    }
  },
  "required": ["answers"]
}
```

### Construção do prompt

```
Você é um assistente de correção de provas escolares.

Para cada questão listada, identifique qual alternativa o aluno marcou.

Regras:
- Use exatamente uma das alternativas válidas listadas abaixo.
- Se a marcação estiver ambígua, rasurada, em branco ou não for possível
  identificar com confiança, retorne "?".
- Não invente respostas.
- Para questões V/F, "V" = verdadeiro, "F" = falso.

Questões esperadas:
- Questão 1: alternativas válidas = [A/B/C/D/E]
- Questão 2: alternativas válidas = [A/B/C/D/E]
- Questão 3: alternativas válidas = [V/F]
...

Retorne APENAS JSON válido conforme o schema definido.
```

A lista explícita de alternativas válidas por questão é essencial – sem ela, o modelo tende a inventar (ex.: marcar "X" em questão V/F).

### Validação defensiva

Mesmo com `responseSchema`, validamos no cliente:

```typescript
for (const ans of parsed.answers || []) {
  const q = exam.questions.find(qq => qq.number === ans.questionNumber);
  if (!q) continue;  // ignora questões inexistentes
  const valid = getOptionsForType(q.type);
  const marked = String(ans.marked || '?').toUpperCase().trim();
  result[q.id] = valid.includes(marked) ? marked : '?';
}
```

Questões não retornadas pela IA ficam como `'?'`.

### Compressão de imagem

- **Largura 1024px**: equilíbrio entre detalhe (legível) e tamanho (~150-300KB por imagem).
- **JPEG q=0.7**: redução adicional sem perda visual perceptível para texto.
- **Resultado**: requisição típica de 200-500KB com 1-2 fotos. Latência típica: 3-8s.

---

## 5. Cálculo de nota

```typescript
export function calculateGrade(
  exam: Exam,
  detectedAnswers: Record<string, string>,
): GradeResult {
  const totalWeight = exam.questions.reduce((s, q) => s + q.weight, 0) || 1;
  let weightedHits = 0;
  let hits = 0;
  let misses = 0;
  const perQuestion: GradeResult['perQuestion'] = [];

  for (const q of exam.questions) {
    const detected = (detectedAnswers[q.id] || '').toUpperCase();
    const expected = q.correctAnswer.toUpperCase();
    const correct = detected !== '' && detected !== '?' && detected === expected;
    if (correct) {
      weightedHits += q.weight;
      hits++;
    } else {
      misses++;
    }
    perQuestion.push({ questionId: q.id, correct, detected: detected || '?', expected });
  }

  const score = Math.round((weightedHits / totalWeight) * 100) / 10;
  return { score, hits, misses, perQuestion };
}
```

### Decisões

- **Normalização para 0-10** independente da soma dos pesos. Se a soma for 30, ainda assim a nota máxima é 10.
- **Arredondamento para 1 casa decimal** (padrão brasileiro: 7,5; 8,0; 9,3).
- **`'?'` conta como erro** – decisão pedagógica: se o aluno não marcou ou a IA não detectou e o professor não corrigiu, é erro.
- **Comparação case-insensitive** – evita bugs por capitalização.
- **Divisor `|| 1`** – proteção contra divisão por zero (caso edge: prova sem questões ou com pesos zerados).

---

## 6. Persistência local

### Chaves AsyncStorage

| Chave | Tipo | Descrição |
|---|---|---|
| `@provafacil/exams` | `Exam[]` | Todas as provas cadastradas |
| `@provafacil/corrections` | `Correction[]` | Todas as correções de todas as provas |

### Por que coleções flat e não índices por exam?

Para o volume de dados esperado (até centenas de provas, milhares de correções por professor), filtrar em JS é trivial e simplifica o código:

```typescript
async listByExam(examId: string): Promise<Correction[]> {
  const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
  return all.filter((c) => c.examId === examId);
}
```

Para Fase 3 com volumes maiores e queries complexas, migrar para SQLite.

### Cascade delete

Ao excluir uma prova, todas as correções dela são removidas:

```typescript
async remove(id: string): Promise<void> {
  // ...remove a prova...
  const corrections = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
  await writeJSON(
    CORRECTIONS_KEY,
    corrections.filter((c) => c.examId !== id),
  );
}
```

---

## 7. Exportação CSV

```typescript
const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
await FileSystem.writeAsStringAsync(fileUri, csv, {
  encoding: FileSystem.EncodingType.UTF8,
});
await Sharing.shareAsync(fileUri, {
  mimeType: 'text/csv',
  UTI: 'public.comma-separated-values-text',
});
```

### Decisões

- **`cacheDirectory`** (não `documentDirectory`) – iOS limpa automaticamente, evita acúmulo.
- **Vírgula decimal** (`8,0` em vez de `8.0`) – padrão pt-BR, abre direto no Excel/Sheets brasileiros.
- **Escape de vírgulas e aspas** com regex `/[",\n;]/`.
- **Nome do arquivo** sanitizado (`/[^\w\-]+/g`) – evita problemas com acentos no Share Sheet.

### Importação no `expo-file-system/legacy`

A SDK 54 introduziu uma nova API baseada em classes (`File`, `Paths`). Mantemos a API legada (`writeAsStringAsync`, `EncodingType`, `cacheDirectory`) por simplicidade — o módulo `expo-file-system/legacy` é oficialmente suportado durante todo o ciclo do SDK 54.

---

## 8. Sistema de tema

`src/theme.ts` exporta:

### Cores semânticas

```typescript
{
  primary, primaryDark, primaryLight, primarySurface,  // indigo
  accent, accentLight,                                  // emerald
  warning, warningLight,                                // amber
  danger, dangerLight,                                  // red
  bg, surface, surfaceMuted, border,                   // backgrounds
  textPrimary, textSecondary, textMuted,               // text
  scoreGood, scoreMid, scoreBad,                       // grades
}
```

### Espaçamento (8pt grid + 4pt micro)

```typescript
{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
```

### Raio de borda

```typescript
{ sm: 8, md: 12, lg: 16, xl: 24, full: 999 }
```

### Funções utilitárias

- `scoreColor(score: number)` – cor da nota (verde/amarelo/vermelho).
- `scoreLabel(score: number)` – "Aprovado" / "Recuperação" / "Reprovado".

### Integração com Paper

O tema do React Native Paper é construído a partir desses tokens, garantindo consistência entre componentes Paper (Button, TextInput, Dialog) e componentes custom.

---

## 9. Navegação

```typescript
type RootStackParamList = {
  Home: undefined;
  CreateExam: undefined;
  ExamDetail: { examId: string };
  Capture: { examId: string };
  Review: { examId: string; studentName: string; photoUris: string[] };
  Result: {
    examId: string;
    studentName: string;
    photoUris: string[];
    detectedAnswers: Record<string, string>;
  };
};
```

### Fluxo

```
Home ──► CreateExam ──► (pop) Home
  │
  └─► ExamDetail ──► Capture ──► Review ──► Result ──► (reset) Home + ExamDetail
```

### Por que `CommonActions.reset` no fim?

Após salvar uma correção, queremos voltar ao detalhe da prova **sem** o "back" voltar para Result/Review/Capture (que estariam stale). O `reset` substitui a stack inteira por `[Home, ExamDetail]`.

---

## 10. Tratamento de erros

### Princípios

1. **Não usar `try/catch` que silencia erros.** Sempre logar ou mostrar ao usuário.
2. **Errors específicos como classes** – ex.: `GeminiKeyMissingError` para distinguir erro de configuração de erro de rede.
3. **Fallback gracioso** – se Gemini falha, tela de revisão abre vazia (todas como `'?'`) para preenchimento manual. App nunca trava.
4. **Mensagens em português** – usuário final é professor brasileiro.

### Locais críticos

| Local | Estratégia |
|---|---|
| `geminiVision.ts` | Throw específico se sem chave; throw genérico em outros erros (capturados em `ReviewScreen`) |
| `ReviewScreen` | Captura erro do Gemini, mostra banner de aviso, deixa preencher manualmente |
| `csvExport.ts` | Throw em escrita; capturado em `ExamDetailScreen` com Alert |
| `storage.ts` | Try/catch silencioso ao parsear JSON inválido (retorna fallback) |

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Gemini retorna número de questão inexistente | Filtramos no `geminiVision.ts` antes de salvar |
| Foto muito grande estoura limite da API | `expo-image-manipulator` redimensiona para 1024px |
| Usuário esquece de configurar `.env` | App detecta chave ausente; tela de revisão mostra aviso e permite preenchimento manual |
| `EXPO_PUBLIC_*` exposto no bundle | Documentado no README; recomendação de proxy backend antes de publicação |
| AsyncStorage estoura quota (10MB no iOS) | Não armazenamos as fotos no AsyncStorage – apenas URIs locais. As fotos vivem no `cacheDirectory` |
| AsyncStorage limpo pelo iOS em low-storage | Risco real para Fase 1; mitigação na Fase 3 com sync para backend |
| Quota do tier gratuito (15 RPM) | Limitação aceitável – professor faz uma correção por vez. Se necessário, upgrade do plano |
| Mudança de API do Gemini | URL e modelo configuráveis via env – atualizamos sem deploy |

---

## Próximos passos técnicos

### Curto prazo

- Testes unitários para `grading.ts` e validação do Gemini.
- Testes de componente para `QuestionRow`, `AnswerCell`.
- E2E com Maestro para os fluxos críticos.

### Médio prazo

- Backend proxy (Cloudflare Workers ou Vercel Edge) para esconder a chave do Gemini.
- Fase 2: questões discursivas (tela "Adicionar resposta esperada" → Gemini compara semanticamente).
- Migrar AsyncStorage → expo-sqlite quando volume de dados crescer.

### Longo prazo

- Auth + sync (Supabase ou Firebase) para professor usar em múltiplos dispositivos.
- App admin web (React + Vite) para coordenação escolar.
- Modelo próprio fine-tuned para padrões brasileiros (cabeçalhos com nome+turma+data, formatos de gabarito).
