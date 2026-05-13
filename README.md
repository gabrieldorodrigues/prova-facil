# 📝 Avaliação Fácil

> Aplicativo mobile de correção inteligente de avaliações escolares por foto, usando visão computacional e IA generativa.

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-4285f4?logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 👥 Equipe

| # | Nome | Curso |
|---|------|-------|
| 1 | Dauane Neves Gerônimo | Engenharia de Software |
| 2 | Eliandra Cardoso | Engenharia de Software |
| 3 | Erik Schneider Pacheco | Engenharia de Software |
| 4 | Gabriel de Oliveira Rodrigues | Engenharia de Software |
| 5 | Gabriel Willian Bernardino Duarte | Engenharia de Software |

---

## 🎯 Visão geral

O **Avaliação Fácil** transforma o smartphone do professor em um corretor automático de avaliações.

O fluxo é simples e poderoso:

1. O professor cadastra **turmas** e os **alunos** de cada uma.
2. Cria uma avaliação com nome, turmas atribuídas, questões e gabarito (com peso por questão).
3. Tira fotos das avaliações respondidas — uma por vez (por aluno) ou em lote (várias de uma turma).
4. A IA do Google Gemini lê as marcações **e o nome do aluno** no cabeçalho.
5. O app faz fuzzy match contra a lista de alunos da turma, e o professor confirma/ajusta.
6. A nota é calculada automaticamente no sistema brasileiro de 0 a 10.
7. O boletim da turma pode ser exportado em CSV.

> **MVP – Fase 1:** apenas questões objetivas (múltipla escolha A–E, A–D, V/F). As fases seguintes contemplam correção discursiva via IA, dashboards e integração com sistemas escolares.

---

## ✨ Funcionalidades

### Implementadas (Fase 1 – MVP)

| Funcionalidade | Descrição |
|---|---|
| 🏫 **Gestão de turmas e alunos** | Cadastro de turmas, alunos por turma, com avatares e contadores. Avaliações podem ser atribuídas a múltiplas turmas. |
| 📋 **Cadastro/edição de avaliações** | Nome, múltiplas turmas, questões dinâmicas com 3 tipos (A–E, A–D, V/F), pesos individuais e helper para distribuir pesos automaticamente. Edição posterior preservando correções já feitas. |
| 📸 **Captura por foto** | Câmera ou galeria, múltiplas fotos por avaliação (várias páginas), pré-visualização com miniaturas numeradas |
| 🤖 **Detecção por IA** | Google Gemini 3.1 Flash Lite (Vision) analisa as marcações e retorna JSON estruturado, com `responseSchema` |
| 👥 **Identificação automática de aluno** | A IA também lê o nome no cabeçalho da avaliação; o app faz fuzzy match com a lista de alunos da turma |
| 🚀 **Correção em lote** | Tira N fotos, processa todas em paralelo, revisa em uma tela única — ~12min para 30 avaliações |
| ✏️ **Revisão editável** | Professor pode ajustar qualquer resposta detectada com um toque; questões inseguras aparecem com chip "verificar" |
| 🎯 **Correção automática** | Cálculo ponderado da nota (0–10), com classificação Aprovado / Recuperação / Reprovado |
| 📊 **Dashboard da avaliação** | Estatísticas da turma, média, melhor nota, aprovados; gabarito oficial; correções agrupadas por turma |
| 📤 **Exportação CSV** | Compartilhamento via Share Sheet do iOS (WhatsApp, e-mail, Drive, AirDrop, etc.) |
| 💾 **Persistência local** | AsyncStorage com migração automática entre versões; funciona offline (exceto a chamada da IA) |
| 🎨 **UI moderna** | Componentes próprios estilo nativecn-ui (shadcn-for-RN) sobre NativeWind + Tailwind, paleta azul/amarelo/verde, dialogs nativos via Modal RN |

### Roadmap

| Fase | Itens |
|---|---|
| **2** | Correção de questões discursivas via IA, detecção de escrita manual, feedback automático ao aluno |
| **3** | Dashboard escolar, relatórios PDF, gestão de turmas, histórico longitudinal, IA fine-tuned para padrões educacionais brasileiros |
| **Futuro** | QR Code na avaliação, leitura em lote, detecção de cola, geração automática de avaliações, integração com Google Classroom |

---

## 🛠 Stack técnica

### Mobile
- **React Native 0.81** + **React 19** – framework cross-platform com new architecture (Fabric) habilitada
- **Expo SDK 54** (managed workflow) – build e distribuição via Expo Go
- **TypeScript** strict – tipagem em todo o código
- **React Navigation 7** – `native-stack` + `bottom-tabs`

### UI
- **NativeWind 4** + **Tailwind CSS 3** – styling utility-first em RN
- **Componentes próprios** em `src/components/ui/` no padrão **nativecn-ui** (shadcn-for-RN): Button, Input, Dialog, Toast, Tabs, Card, Badge, Fab, IconButton, SegmentedControl, Spinner — fontes copiadas para o projeto e customizáveis
- **`class-variance-authority`** + **`clsx`** + **`tailwind-merge`** para variantes e composição de classes
- **`@expo/vector-icons`** (Ionicons) – ícones

### IA & Visão
- **Google Gemini 3.1 Flash Lite** – modelo multimodal para análise de imagens
- Resposta com `responseSchema` JSON estruturado (zero parsing frágil)
- Detecção em lote (`detectBatch`) processa múltiplas fotos em paralelo

### Mídia
- `expo-image-picker` – câmera e galeria
- `expo-image-manipulator` – redimensiona para 1024px e comprime (q=0.7) antes de enviar à API

### Persistência
- `@react-native-async-storage/async-storage` – chave-valor local com migração v1 → v2 transparente

### Exportação
- `expo-file-system` – escreve CSV no `cacheDirectory`
- `expo-sharing` – Share Sheet nativo

---

## 🏗 Arquitetura

```
┌────────────────────────────────────────────────────────────────────┐
│                          CAMADA DE TELAS                            │
│  HomeScreen   ClassesScreen     ClassDetailScreen                  │
│  ExamsScreen  CreateExamScreen  EditExamScreen   ExamDetailScreen  │
│  CaptureScreen   BatchCaptureScreen   ReviewScreen                 │
│  BatchReviewScreen   ResultScreen                                  │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────────────┐
│                      CAMADA DE COMPONENTES                          │
│  src/components/                                                    │
│    AnswerCell  QuestionRow  StatCard  ScoreBadge  EmptyState       │
│    SectionHeader  ClassMultiSelectDialog                           │
│  src/components/ui/  (estilo nativecn-ui, copiados para o projeto) │
│    Button  Input  Dialog  Toast  Tabs  Card  Badge                 │
│    Fab  IconButton  SegmentedControl  Spinner                      │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────────────┐
│                       CAMADA DE SERVIÇOS                            │
│  storage.ts       geminiVision.ts        csvExport.ts              │
│  (Async + v2      (Gemini Vision +       (FS + Sharing)            │
│   migration)       detectBatch)                                    │
└──────┬───────────────────┬────────────────────────┬────────────────┘
       │                   │                        │
       ▼                   ▼                        ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐
│ AsyncStorage │  │  Gemini API    │  │  iOS Share Sheet     │
│   (local)    │  │   (cloud)      │  │   (WhatsApp/email)   │
└──────────────┘  └────────────────┘  └──────────────────────┘
```

### Fluxo de correção (individual e em lote)

```
Professor abre app
       │
       ▼
┌────────────────────────┐   ┌────────────────────────┐
│  Cadastra turmas e     │──▶│ Salva no AsyncStorage  │
│  alunos                │   │  classes / students    │
└────────────────────────┘   └────────────────────────┘
       │
       ▼
┌────────────────────────┐   ┌────────────────────────┐
│  Cria avaliação        │──▶│ Salva exam com        │
│  + gabarito            │   │ classIds[]            │
│  + atribui à(s) turma(s)   │                       │
└────────────────────────┘   └────────────────────────┘
       │
       ▼
┌─────────────────────┐    ┌─────────────────────────┐
│  Individual:        │    │  Em lote:               │
│  seleciona aluno +  │    │  seleciona turma +      │
│  tira fotos         │    │  tira N fotos           │
└──────────┬──────────┘    └────────────┬────────────┘
           │                            │
           ▼                            ▼
┌──────────────────────────────────────────────────────┐
│ expo-image-manipulator → 1024px / JPEG 0.7 / base64  │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│ POST gemini-3.1-flash-lite (1 chamada por foto)      │
│ ├─ prompt com questões + alternativas válidas        │
│ ├─ instrução para ler nome do aluno (lote)           │
│ ├─ imagem em inline_data                             │
│ └─ responseSchema JSON                               │
└──────────────────────────┬───────────────────────────┘
                           │ JSON estruturado
                           ▼
┌──────────────────────────────────────────────────────┐
│ findStudentByName: fuzzy match contra lista da turma │
│ (normalize NFD, tokens, score >= 0.5)                │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│ Tela de revisão (individual ou batch review)         │
│   → professor ajusta respostas                       │
│   → professor confirma/troca aluno                   │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│ utils/grading.ts                                     │
│ score = (Σ pesos_corretos / Σ pesos) * 10            │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────┐
│  Salva Correction no AsyncStorage   │
│  + reset para ExamDetail            │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Exporta CSV da turma quando desejar  │
└──────────────────────────────────────┘
```

---

## 📁 Estrutura do projeto

```
prova-facil/
├── App.tsx                              # entry point com ToastProvider + AppNavigator
├── app.json                             # config Expo (iOS bundleId, permissões)
├── package.json                         # deps Expo SDK 54
├── babel.config.js                      # preset-expo + nativewind
├── metro.config.js                      # withNativeWind(config, { input: './global.css' })
├── tailwind.config.js                   # paleta brand/accent/success/warn/danger/ink/bg/line
├── global.css                           # @tailwind base/components/utilities
├── nativewind-env.d.ts                  # tipos do NativeWind v4
├── tsconfig.json                        # strict + paths { "@/*": ["./src/*"] }
├── .env.example                         # template das variáveis de ambiente
│
├── docs/
│   ├── USER_GUIDE.md                    # manual do professor
│   └── ARCHITECTURE.md                  # documentação técnica detalhada
│
└── src/
    ├── theme.ts                         # design tokens (cores/spacing/radius/elevation/scoreColor/scoreLabel)
    │
    ├── lib/
    │   └── utils.ts                     # helper cn() (clsx + tailwind-merge)
    │
    ├── types/
    │   └── index.ts                     # QuestionType, Class, Student, Exam, Question, Correction
    │
    ├── services/
    │   ├── storage.ts                   # CRUD AsyncStorage (classes/students/exams/corrections) + migração v1→v2
    │   ├── geminiVision.ts              # detectAnswers + detectBatch (responseSchema)
    │   └── csvExport.ts                 # geração e compartilhamento de CSV
    │
    ├── utils/
    │   └── grading.ts                   # cálculo de nota ponderada 0–10 + getOptionsForType
    │
    ├── components/
    │   ├── ui/                          # componentes nativecn-style (substituem react-native-paper)
    │   │   ├── Button.tsx               # variants: default | secondary | ghost | tonal | destructive | link
    │   │   ├── Input.tsx                # TextInput estilizado com label estático
    │   │   ├── Dialog.tsx               # Modal RN + DialogTitle/Content/ScrollArea/Actions
    │   │   ├── Toast.tsx                # ToastProvider + useToast() hook
    │   │   ├── Tabs.tsx                 # Tabs/TabsList/TabsTrigger/TabsContent (controlado opcional)
    │   │   ├── Card.tsx                 # Card / CardHeader / CardTitle / CardContent / CardFooter
    │   │   ├── Badge.tsx                # default | secondary | destructive | success | warn
    │   │   ├── Fab.tsx                  # FAB com Ionicons + label
    │   │   ├── IconButton.tsx           # Pressable circular com Ionicons
    │   │   ├── SegmentedControl.tsx     # controlado (value / onValueChange / options[])
    │   │   └── Spinner.tsx              # wrapper sobre ActivityIndicator
    │   ├── AnswerCell.tsx               # célula clicável A/B/C/D/E/V/F (default/selected/correct/wrong/unknown)
    │   ├── QuestionRow.tsx              # editor de uma questão (tipo/resposta/peso)
    │   ├── StatCard.tsx                 # card de métrica
    │   ├── ScoreBadge.tsx               # badge colorido com a nota
    │   ├── EmptyState.tsx               # estado vazio com emoji + CTA
    │   ├── SectionHeader.tsx            # cabeçalho de seção tipográfico
    │   └── ClassMultiSelectDialog.tsx   # seleção de múltiplas turmas com criar nova
    │
    ├── navigation/
    │   └── AppNavigator.tsx             # RootStack + bottom tabs (Home/TurmasTab/AvaliacoesTab)
    │
    └── screens/
        ├── HomeScreen.tsx               # dashboard com stats + ações rápidas + avaliações recentes
        ├── ClassesScreen.tsx            # lista de turmas (aba Turmas)
        ├── ClassDetailScreen.tsx        # alunos da turma + avaliações atribuídas
        ├── ExamsScreen.tsx              # lista de avaliações (aba Avaliações)
        ├── CreateExamScreen.tsx         # cadastro de avaliação (multi-turma)
        ├── EditExamScreen.tsx           # edição de avaliação existente
        ├── ExamDetailScreen.tsx         # gabarito + correções por turma + CSV
        ├── CaptureScreen.tsx            # selecionar aluno + fotos (correção individual)
        ├── BatchCaptureScreen.tsx       # selecionar turma + N fotos (correção em lote)
        ├── BatchReviewScreen.tsx        # revisão lote (IA + match de aluno + ScoreBadge)
        ├── ReviewScreen.tsx             # revisão individual das respostas detectadas
        └── ResultScreen.tsx             # nota final + detalhe por questão
```

---

## 🚀 Como rodar

### Pré-requisitos

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **App Expo Go** instalado no iPhone (Android também funciona) – [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Chave da API do Google Gemini** – gratuita em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Setup

```bash
# 1. Clone o repositório
git clone <repo-url>
cd prova-facil

# 2. Instale as dependências
npm install

# 3. Configure a chave da API
cp .env.example .env
# Abra o .env e cole sua chave em EXPO_PUBLIC_GEMINI_API_KEY

# 4. Inicie o servidor
npx expo start
```

### Rodando no iPhone

1. **Mesma Wi-Fi** que o computador.
2. Abra a **câmera nativa** do iPhone e aponte para o QR code do terminal.
3. Toque na notificação que abre o **Expo Go**.

> Caso a Wi-Fi bloqueie a conexão, abra o Expo Go → "Enter URL manually" → digite `exp://<ip-da-máquina>:8081`.

### Variáveis de ambiente

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `EXPO_PUBLIC_GEMINI_API_KEY` | sim | – | Chave do Google AI Studio |
| `EXPO_PUBLIC_GEMINI_MODEL` | não | `gemini-3.1-flash-lite` | Modelo Gemini Vision a usar |

> ⚠️ Variáveis prefixadas `EXPO_PUBLIC_` ficam embutidas no bundle. Para ambiente de produção, mova a chamada da API para um backend proxy.

---

## 📐 Modelo de dados

```typescript
type QuestionType = 'mc5' | 'mc4' | 'tf';
// mc5 = múltipla escolha A-E
// mc4 = múltipla escolha A-D
// tf  = verdadeiro/falso

interface Question {
  id: string;
  number: number;          // 1..N
  type: QuestionType;
  correctAnswer: string;   // 'A'..'E' | 'A'..'D' | 'V' | 'F'
  weight: number;          // peso da questão (somatório livre)
}

interface Class {
  id: string;
  name: string;
  createdAt: string;       // ISO 8601
}

interface Student {
  id: string;
  classId: string;         // FK → Class
  name: string;
  createdAt: string;       // ISO 8601
}

interface Exam {
  id: string;
  name: string;
  classIds: string[];      // turmas atribuídas (multi)
  createdAt: string;       // ISO 8601
  questions: Question[];
}

interface Correction {
  id: string;
  examId: string;
  studentId: string | null;     // FK → Student (null se não identificado)
  studentNameRaw: string | null; // o que a IA leu (mesmo sem match)
  photoUris: string[];
  detectedAnswers: Record<string, string>;  // questionId → 'A'|'B'|...|'?'
  score: number;                            // 0-10
  hits: number;
  misses: number;
  correctedAt: string;                      // ISO 8601
  identified: boolean;                      // tinha match com aluno cadastrado?
}
```

> **Migração v1 → v2:** dados gravados antes da introdução de turmas/alunos são migrados automaticamente na primeira leitura (`@provafacil/migration_v2_done`). Avaliações com `className` viram `classIds: [<gerado>]`; correções com `studentName` ganham `studentId` quando há match na turma da avaliação.

### Cálculo da nota

```
totalPeso = Σ question.weight
notaPonderada = Σ question.weight (onde detectado === correto)
nota = (notaPonderada / totalPeso) * 10
```

A nota é arredondada para **uma casa decimal**, no padrão brasileiro (0–10).

### Paleta de cores (design tokens)

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#2C5F9E` | brand azul, ações primárias, FABs |
| `accent` | `#FFC107` | destaques amarelos (chips, ícones de status) |
| `success` | `#16A34A` | resposta correta, toast de sucesso |
| `warning` | `#F59E0B` | indicações pendentes, aviso |
| `danger` | `#EF4444` | exclusão, resposta errada |
| `bg` | `#F5F5F0` | fundo da app (warm) |
| `surface` | `#FFFFFF` | cards e dialogs |
| `text` | `#333333` | texto principal |
| `secondary` | `#7E8BA3` | texto secundário/muted, bordas suaves |

### Classificação

| Nota | Status | Cor (scoreColor) |
|---|---|---|
| ≥ 7,0 | Aprovado | Verde (`#16A34A`) |
| 5,0 – 6,9 | Recuperação | Amarelo escuro (`#D97706`) |
| < 5,0 | Reprovado | Vermelho (`#DC2626`) |

---

## 🔒 Privacidade e segurança

- **Dados armazenados localmente** no AsyncStorage do dispositivo. Nada é enviado a servidores próprios.
- **Imagens enviadas ao Google Gemini** apenas durante a correção. O Google declara não usar dados pagos da API para treinar modelos. Para usuários do tier gratuito, recomendamos consultar a [política de uso de dados do Google AI Studio](https://ai.google.dev/gemini-api/terms).
- **Chave de API**: para distribuição em loja, mover a chamada do Gemini para um backend proxy próprio (a chave `EXPO_PUBLIC_*` fica visível no bundle).
- **Direito do aluno**: o professor é responsável pela LGPD ao fotografar avaliações com identificação pessoal. Recomendação: borrar nomes na captura quando não forem necessários.

---

## ⚠️ Limitações conhecidas (MVP)

- **Apenas questões objetivas.** Discursivas estão na Fase 2.
- **A IA pode errar.** Sempre revise as respostas detectadas antes de salvar – por isso a tela de revisão existe.
- **Sem login nem sincronização entre dispositivos.** Os dados ficam no aparelho onde foram criados.
- **Sem backend próprio.** A correção de uma turma fica vinculada ao dispositivo do professor (export CSV é o mecanismo de portabilidade).
- **Chave da API exposta no bundle.** OK para uso pessoal/desenvolvimento; resolver com proxy antes de publicar.

---

## 📚 Documentação adicional

- [Manual do professor](docs/USER_GUIDE.md) – tutorial passo a passo do uso diário.
- [Arquitetura técnica](docs/ARCHITECTURE.md) – decisões de design, fluxos de dados, integração com Gemini.

---

## 📝 Licença

MIT

---

<p align="center">
  Feito com ☕ e 💜 por estudantes de Engenharia de Software
</p>
