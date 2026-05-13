# 🏗 Arquitetura Técnica — Avaliação Fácil

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
- **Não exige template fixo** – professor pode usar qualquer avaliação existente.
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

- O modelo de dados é **simples** (quatro coleções: classes, students, exams, corrections).
- O volume é **baixo** (centenas de registros por professor).
- AsyncStorage é **chave-valor** já incluído no Expo, zero configuração.
- Para Fase 3 (relatórios complexos, queries), SQLite via `expo-sqlite` será adicionado.

### Por que componentes próprios em estilo nativecn-ui (e não react-native-paper)?

O projeto começou com `react-native-paper` (Material 3). Foi migrado para componentes próprios no padrão **nativecn-ui** (shadcn-for-RN) sobre **NativeWind 4 + Tailwind 3** por:

- **Estilo shadcn**: o CLI `npx nativecn-ui add` copia o código-fonte dos componentes para `src/components/ui/`. Eles passam a ser código nosso — editáveis sem fork, sem bundle externo, sem versão para travar.
- **Coerência com NativeWind**: o app já tinha estilização utility-first em todas as telas (`className="flex-row bg-bg-surface"`). Manter dois sistemas (Paper tema + NativeWind classes) era redundante.
- **Bundle menor**: removido `react-native-paper` (~250KB) e `MD3LightTheme`. Adicionados `class-variance-authority` + `clsx` + `tailwind-merge` (~12KB combinados).
- **Dialog próprio sobre `Modal` do RN**: todos os 8 usos eram controlados (`open`/`onOpenChange`); o compound API uncontrolled do nativecn não casava. A versão nossa expõe `<Dialog open onOpenChange>` + `DialogTitle` / `DialogContent` / `DialogScrollArea` / `DialogActions`.
- **Toast imperativo via hook**: `useToast()` retorna `toast(message, variant, duration)` substituindo `Snackbar` do Paper.

A migração também trocou a paleta indigo/emerald do MD3 por azul/amarelo/verde própria, definida em `tailwind.config.js` e `src/theme.ts`.

Trade-offs aceitos:
- **Acessibilidade manual**: Paper auto-injetava `accessibilityLabel` em alguns botões. Nossos `IconButton`/`Fab` exigem prop explícita — auditados manualmente.
- **Sem label flutuante**: o `Input` tem label estático acima do campo (estilo shadcn) em vez do label que sobe ao focar. Decisão visual.

---

## 2. Camadas e responsabilidades

### `src/screens/` – Camada de tela
Cada arquivo é uma "página" da aplicação. Responsabilidade: orquestrar componentes, chamar serviços, gerenciar estado local de UI. Não contém lógica de negócio.

Telas: `HomeScreen`, `ClassesScreen`, `ClassDetailScreen`, `ExamsScreen`, `CreateExamScreen`, `EditExamScreen`, `ExamDetailScreen`, `CaptureScreen`, `BatchCaptureScreen`, `BatchReviewScreen`, `ReviewScreen`, `ResultScreen`.

### `src/components/` – Componentes reutilizáveis (domínio)
- `AnswerCell` – célula clicável com 5 variantes (default, selected, correct, wrong, unknown).
- `QuestionRow` – editor completo de uma questão (tipo + resposta + peso).
- `StatCard` – card de métrica com label, valor e hint.
- `ScoreBadge` – badge da nota com cor automática conforme valor.
- `EmptyState` – estado vazio com emoji + título + descrição + CTA opcional.
- `SectionHeader` – cabeçalho de seção com tipografia consistente.
- `ClassMultiSelectDialog` – seleção múltipla de turmas com ação "criar nova".

### `src/components/ui/` – Componentes nativecn-style
Primitivos copiados via `npx nativecn-ui add` e customizados:
- `Button` – `variant: default | secondary | ghost | tonal | destructive | link`, `size: default | sm | lg`, props `loading`, `iconLeft`, `iconRight`. Wrapper inteligente: envolve children em `<Text>` automaticamente quando não é um `React.isValidElement`.
- `Input` – `TextInput` estilizado com label estático opcional + `error` opcional. Spread completo de props nativas.
- `Dialog` – sobre `Modal` do RN. API: `<Dialog open onOpenChange>` + `DialogTitle` / `DialogContent` / `DialogScrollArea` / `DialogActions`. Backdrop com `bg-black/50`, dispensa por toque ou `onRequestClose` (back do Android).
- `Toast` – `<ToastProvider position="top">` + `useToast()` hook. Variants `default | destructive | success | info`. Animado via `Animated` do RN.
- `Tabs` – `Tabs` (controlado opcional via `value`/`onValueChange` ou uncontrolled via `defaultValue`) + `TabsList`/`TabsTrigger`/`TabsContent`.
- `Card`, `Badge` – primitivos visuais.
- `Fab`, `IconButton` – componentes próprios sobre `Pressable` + Ionicons (não existem no nativecn-ui base).
- `SegmentedControl` – wrapper sobre Tabs controlado, renderiza só os triggers.
- `Spinner` – wrapper sobre `ActivityIndicator` com cor padrão.

### `src/lib/`
- `utils.ts` – helper `cn(...inputs)` (clsx + tailwind-merge) usado por todos os componentes UI.

### `src/services/` – Camada de integração
- `storage.ts` – AsyncStorage com 4 coleções + migração v1→v2 transparente + `findStudentByName` (fuzzy match).
- `geminiVision.ts` – API HTTP do Google Gemini, expondo `detectAnswers` (1 avaliação) e `detectBatch` (várias em paralelo, com callback de progresso).
- `csvExport.ts` – sistema de arquivos + Share Sheet, agrupamento por turma.

### `src/utils/` – Funções puras
- `grading.ts` – `calculateGrade`, `getOptionsForType`.

### `src/types/` – Tipos TypeScript compartilhados
Single source of truth para `QuestionType`, `Class`, `Student`, `Exam`, `Question`, `Correction`, `QUESTION_TYPE_LABEL`.

### `src/theme.ts` – Design tokens
Cores semânticas, spacing, radius, elevation, `scoreColor`, `scoreLabel`. **Não exporta mais `paperTheme`.**

### `tailwind.config.js`
Paleta espelhada em classes utility (`bg-brand-500`, `text-ink`, `border-line`, etc.). Consumida por NativeWind v4.

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

interface Class {
  id: string;
  name: string;
  createdAt: string;       // ISO 8601
}

interface Student {
  id: string;
  classId: string;         // FK Class
  name: string;
  createdAt: string;       // ISO 8601
}

interface Exam {
  id: string;
  name: string;
  classIds: string[];      // 1..N turmas atribuídas
  createdAt: string;       // ISO 8601
  questions: Question[];
}

interface Correction {
  id: string;
  examId: string;          // FK Exam
  studentId: string | null;     // FK Student (null se não identificado)
  studentNameRaw: string | null; // o que a IA leu da foto, mesmo sem match
  photoUris: string[];
  detectedAnswers: Record<string, string>;  // questionId → resposta
  score: number;           // 0-10, 1 casa decimal
  hits: number;
  misses: number;
  correctedAt: string;     // ISO 8601
  identified: boolean;     // teve match com Student?
}
```

### Decisões

- **IDs por UUID** (via `expo-crypto`), não autoincrement, para suportar múltiplos dispositivos no futuro sem colisão.
- **`number` separado do `id`** – número da questão é apresentação, ID é identidade. Permite reordenar questões mantendo histórico de correções.
- **`detectedAnswers` como `Record<string, string>`** – usa o ID da questão como chave, robusto a reordenação.
- **`score` denormalizado** – armazena o resultado calculado para evitar recalcular ao listar correções (e mantê-lo estável caso o gabarito seja editado no futuro).
- **`Exam.classIds[]` (multi-turma)** – uma avaliação pode ser aplicada em mais de uma turma simultaneamente (ex.: 9ºA + 9ºB com mesmo gabarito).
- **`Correction.studentId | null`** – correção pode existir sem aluno identificado (IA falhou em ler o nome ou rasura). Tela de revisão permite atribuir depois. `studentNameRaw` preserva o que a IA leu para ajudar a identificar.
- **`identified: boolean` denormalizado** – facilita filtros e UI sem JOIN no AsyncStorage.

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
│ - questionNumber existe na avaliação?      │
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
Você é um assistente de correção de avaliações escolares.

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
- **Divisor `|| 1`** – proteção contra divisão por zero (caso edge: avaliação sem questões ou com pesos zerados).

---

## 6. Persistência local

### Chaves AsyncStorage

| Chave | Tipo | Descrição |
|---|---|---|
| `@provafacil/classes` | `Class[]` | Todas as turmas cadastradas |
| `@provafacil/students` | `Student[]` | Todos os alunos (com `classId`) |
| `@provafacil/exams` | `Exam[]` | Todas as avaliações (com `classIds[]`) |
| `@provafacil/corrections` | `Correction[]` | Todas as correções (com `studentId` opcional) |
| `@provafacil/migration_v2_done` | `'1' \| null` | Flag de migração v1→v2 (só roda uma vez) |

### Por que coleções flat e não índices por exam?

Para o volume de dados esperado (até centenas de avaliações, milhares de correções por professor), filtrar em JS é trivial e simplifica o código:

```typescript
async listByExam(examId: string): Promise<Correction[]> {
  const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
  return all.filter((c) => c.examId === examId);
}
```

Para Fase 3 com volumes maiores e queries complexas, migrar para SQLite.

### Cascade delete

Ao excluir uma turma:
1. Turma removida.
2. Todos os alunos com `classId` apagados.
3. `classIds[]` de cada avaliação filtrado; avaliações sem turma sobrando são apagadas.
4. Correções dessas avaliações excluídas em cascata.

Ao excluir um aluno:
1. Aluno removido.
2. Correções com `studentId` apontando para ele têm `studentId` setado para `null` e `identified: false` (a correção é preservada).

Ao excluir uma avaliação:
1. Avaliação removida.
2. Todas as correções dela apagadas.

### Migração v1 → v2

Versões anteriores tinham:
- `Exam.className: string`
- `Correction.studentName: string` (sem FK)

Na primeira leitura após upgrade, `migrateIfNeeded()`:
1. Detecta `Exam.className` ou `Exam.classId` legado e gera/reusa `Class` por nome.
2. Detecta `Correction.studentName` e tenta match com aluno existente da turma (`findStudentByName` — fuzzy). Se não encontrar, cria um novo `Student` na turma da avaliação.
3. Reescreve as 4 coleções e marca `migration_v2_done = '1'`.

A migração é idempotente e só roda uma vez. O código de leitura continua aceitando o formato legado (campo `className` opcional via `LegacyExam`) como fallback defensivo.

### Fuzzy match de nome (`findStudentByName`)

Usado tanto na migração quanto no fluxo de correção em lote:
1. Normaliza nome (NFD, remove acentos, lowercase, alphanum).
2. Match exato → retorna.
3. Caso contrário, tokens com 3+ chars; calcula sobreposição (`overlap / max(tokens_target, tokens_aluno)`); requer score ≥ 0.5.
4. Retorna o melhor match, ou `null`.

Robusto a "Joao Silva" vs "João Silva", "Maria S." vs "Maria Souza", "Ana" vs "Ana Beatriz".

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

Há **duas fontes** que precisam ficar sincronizadas:

1. `src/theme.ts` — constantes JS para uso em `style={{ color: colors.primary }}` em StyleSheets.
2. `tailwind.config.js` — paleta nominal para classes NativeWind (`className="bg-brand-500"`).

### Cores semânticas (`src/theme.ts`)

```typescript
{
  primary, primaryDark, primaryLight, primarySurface,   // azul (#2C5F9E e shades)
  secondary,                                             // slate (#7E8BA3)
  accent, accentDark, accentLight,                       // amarelo (#FFC107 e shades)
  success, successLight,                                 // verde (#16A34A)
  warning, warningLight,                                 // amber (#F59E0B)
  danger, dangerLight,                                   // red (#EF4444)
  bg, surface, surfaceMuted, border,                     // warm bg + white surface
  textPrimary, textSecondary, textMuted, textSubtle,     // hierarchy de texto
  scoreGood, scoreMid, scoreBad,                         // notas
}
```

### Paleta no Tailwind (`tailwind.config.js`)

Nomes equivalentes (com escala 50/100/500/600/700 onde aplicável):

```js
colors: {
  brand:   { DEFAULT, 50, 100, 500, 600, 700 },  // primary
  accent:  { DEFAULT, 50, 100, 500, 600, 700 },
  success: { DEFAULT, 50, 500, 600, 700 },
  warn:    { DEFAULT, 50, 500 },
  danger:  { DEFAULT, 50, 500 },
  ink:     { DEFAULT, muted, subtle },           // text
  bg:      { DEFAULT, surface, muted },
  line:    string,                               // border
}
```

> ⚠️ Ao mudar uma cor, atualizar **os dois arquivos**. O hex fica em ambos lados; consideramos o esforço aceitável dado o tamanho da paleta.

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

### Helper `cn()` (`src/lib/utils.ts`)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usado em todos os componentes UI para mesclar classes customizáveis com classes default sem conflito.

---

## 9. Navegação

### Tipagem

```typescript
type RootStackParamList = {
  MainTabs: undefined;
  ClassDetail: { classId: string };
  CreateExam: { classId?: string };
  EditExam: { examId: string };
  ExamDetail: { examId: string };
  Capture: { examId: string };
  BatchCapture: { examId: string };
  BatchReview: { examId: string; classId: string; photoUris: string[] };
  Review: { examId: string; studentId?: string; studentName: string; photoUris: string[] };
  Result: {
    examId: string;
    studentName: string;
    photoUris: string[];
    detectedAnswers: Record<string, string>;
    studentId?: string;
  };
};

type TabParamList = {
  Home: undefined;
  TurmasTab: { openCreate?: boolean } | undefined;
  AvaliacoesTab: undefined;
};
```

### Estrutura

```
RootStack (NativeStack)
├── MainTabs (BottomTab)
│   ├── Home (HomeScreen)
│   ├── TurmasTab (ClassesScreen)
│   └── AvaliacoesTab (ExamsScreen)
├── ClassDetail
├── CreateExam / EditExam
├── ExamDetail
├── Capture / BatchCapture
├── Review / BatchReview
└── Result
```

### Fluxos

```
HomeScreen
  ├─► QuickAction "Nova turma" ──► TurmasTab + openCreate:true
  │     (ClassesScreen abre dialog automaticamente, depois limpa o param)
  │
  ├─► QuickAction "Nova avaliação" ──► CreateExam ──► (pop) Home
  │
  └─► Avaliações recentes / "Ver todas" ──► ExamDetail ou AvaliacoesTab

ClassesScreen ──► ClassDetail (alunos + avaliações atribuídas)

ExamDetail
  ├─► Capture ──► Review ──► Result ──► (reset) [MainTabs, ExamDetail]
  └─► BatchCapture ──► BatchReview ──► (reset) [MainTabs, ExamDetail]
```

### Composição de navegação no HomeScreen

`HomeScreen` precisa navegar tanto para tabs irmãs (`TurmasTab`, `AvaliacoesTab`) quanto para telas do RootStack (`CreateExam`, `ExamDetail`). Solução: `CompositeNavigationProp`.

```typescript
type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;
```

Sem isso, `navigation.navigate('TurmasTab')` falharia em tipo (não existe no RootStack) ou `navigation.getParent()` ficaria untyped.

### Por que `CommonActions.reset` no fim?

Após salvar uma correção, queremos voltar ao detalhe da avaliação **sem** o "back" voltar para Result/Review/Capture (que estariam stale). O `reset` substitui a stack inteira por `[MainTabs, ExamDetail]`.

> ⚠️ O destino é `MainTabs`, não `Home`. `Home` é uma aba *dentro* de `MainTabs` — referenciá-lo direto no RootStack quebra com `NAVIGATE not handled by any navigator`.

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
| Quota do tier gratuito (15 RPM) | Em correção em lote, processamos em paralelo respeitando o burst; se houver throttle, errors aparecem por entrada e a tela de revisão preserva os bem-sucedidos |
| Mudança de API do Gemini | URL e modelo configuráveis via env – atualizamos sem deploy |
| IA lê nome errado / não lê | `findStudentByName` faz fuzzy match; quando não encontra, correção fica `identified: false` e pode ser atribuída manualmente na revisão |
| Migração v1→v2 inferindo turma errada | A criação automática de `Class` usa o `className` literal da avaliação legacy. Professor pode renomear ou deletar/reorganizar manualmente |
| Inconsistência entre `tailwind.config.js` e `src/theme.ts` | Convenção: alterar paleta sempre nos dois arquivos. Não há sync automático |

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
