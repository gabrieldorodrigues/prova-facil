# 📝 Prova Fácil

> Aplicativo mobile de correção inteligente de provas escolares por foto, usando visão computacional e IA generativa.

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

O **Prova Fácil** transforma o smartphone do professor em um corretor automático de avaliações.

O fluxo é simples e poderoso:

1. O professor cadastra a prova com nome, turma, questões e gabarito.
2. Tira uma foto da prova respondida pelo aluno.
3. A IA do Google Gemini lê as marcações na imagem.
4. O professor revisa e ajusta se necessário.
5. A nota é calculada automaticamente no sistema brasileiro de 0 a 10.
6. O boletim da turma pode ser exportado em CSV.

> **MVP – Fase 1:** apenas questões objetivas (múltipla escolha A–E, A–D, V/F). As fases seguintes contemplam correção discursiva via IA, dashboards e integração com sistemas escolares.

---

## ✨ Funcionalidades

### Implementadas (Fase 1 – MVP)

| Funcionalidade | Descrição |
|---|---|
| 📋 **Cadastro de provas** | Nome, turma, questões dinâmicas com 3 tipos (A–E, A–D, V/F), pesos individuais e helper para distribuir pesos automaticamente |
| 📸 **Captura por foto** | Câmera ou galeria, múltiplas fotos por prova (até várias páginas), pré-visualização com miniaturas numeradas |
| 🤖 **Detecção por IA** | Google Gemini 3.1 Flash Lite (Vision) analisa as marcações e retorna JSON estruturado |
| ✏️ **Revisão editável** | Professor pode ajustar qualquer resposta detectada com um toque, com indicador visual de questões "para verificar" |
| 🎯 **Correção automática** | Cálculo ponderado da nota (0–10), com classificação Aprovado / Recuperação / Reprovado |
| 📊 **Dashboard da prova** | Média da turma, melhor nota, taxa de aprovados, gabarito visual e lista de correções |
| 📤 **Exportação CSV** | Compartilhamento via Share Sheet do iOS (WhatsApp, e-mail, Drive, AirDrop, etc.) |
| 💾 **Persistência local** | AsyncStorage – funciona 100% offline (após carregar a IA) |
| 🎨 **UI moderna** | Design system com paleta indigo/emerald, cards elevados, feedback visual imediato |

### Roadmap

| Fase | Itens |
|---|---|
| **2** | Correção de questões discursivas via IA, detecção de escrita manual, feedback automático ao aluno |
| **3** | Dashboard escolar, relatórios PDF, gestão de turmas, histórico longitudinal, IA fine-tuned para padrões educacionais brasileiros |
| **Futuro** | QR Code na prova, leitura em lote, detecção de cola, geração automática de provas, integração com Google Classroom |

---

## 🛠 Stack técnica

### Mobile
- **React Native 0.81** – framework cross-platform
- **Expo SDK 54** (managed workflow) – build e distribuição via Expo Go
- **TypeScript** strict – tipagem em todo o código
- **React Navigation 7** – stack navigator nativo
- **React Native Paper 5** – componentes Material 3

### IA & Visão
- **Google Gemini 3.1 Flash Lite** – modelo multimodal para análise de imagens
- Resposta com `responseSchema` JSON estruturado (zero parsing frágil)

### Mídia
- `expo-image-picker` – câmera e galeria
- `expo-image-manipulator` – redimensiona para 1024px e comprime (q=0.7) antes de enviar à API

### Persistência
- `@react-native-async-storage/async-storage` – chave-valor local

### Exportação
- `expo-file-system` – escreve CSV no `cacheDirectory`
- `expo-sharing` – Share Sheet nativo

---

## 🏗 Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                       CAMADA DE UI                            │
│   HomeScreen   CreateExamScreen   ExamDetailScreen           │
│   CaptureScreen   ReviewScreen   ResultScreen                │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                  CAMADA DE COMPONENTES                        │
│   QuestionRow  AnswerCell  StatCard  ScoreBadge              │
│   EmptyState   SectionHeader                                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    CAMADA DE SERVIÇOS                         │
│  storage.ts          geminiVision.ts        csvExport.ts     │
│  (AsyncStorage)      (Gemini Vision API)    (FS + Sharing)   │
└──────┬──────────────────┬──────────────────────┬─────────────┘
       │                  │                      │
       ▼                  ▼                      ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐
│ AsyncStorage │  │  Gemini API    │  │  iOS Share Sheet     │
│   (local)    │  │   (cloud)      │  │   (WhatsApp/email)   │
└──────────────┘  └────────────────┘  └──────────────────────┘
```

### Fluxo de correção

```
Professor abre app
       │
       ▼
┌──────────────────┐    ┌──────────────────┐
│  Cria prova      │───▶│ Salva no         │
│  + gabarito      │    │ AsyncStorage     │
└──────────────────┘    └──────────────────┘
       │
       ▼
┌──────────────────┐
│  Tira foto da    │
│  prova do aluno  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ expo-image-manipulator               │
│ → resize 1024px + compress JPEG 0.7  │
│ → base64                              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ POST gemini-3.1-flash-lite           │
│ ├─ prompt com lista de questões      │
│ │  (número + alternativas válidas)   │
│ ├─ imagens em inline_data            │
│ └─ responseSchema JSON               │
└────────┬─────────────────────────────┘
         │ JSON estruturado
         ▼
┌──────────────────┐
│ Tela de revisão  │  ← professor edita se necessário
│ (toque = trocar) │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ utils/grading.ts                       │
│ score = (Σ pesos_corretos / Σ pesos)*10│
└────────┬───────────────────────────────┘
         │
         ▼
┌──────────────────┐    ┌──────────────────┐
│  Tela de         │───▶│ Salva Correction │
│  resultado       │    │ no AsyncStorage  │
└──────────────────┘    └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Exporta CSV da   │
                       │ turma quando     │
                       │ desejar          │
                       └──────────────────┘
```

---

## 📁 Estrutura do projeto

```
prova-facil/
├── App.tsx                              # entry point com PaperProvider + Navigator
├── app.json                             # config Expo (iOS bundleId, permissões)
├── package.json                         # deps Expo SDK 54
├── babel.config.js                      # preset-expo
├── tsconfig.json                        # TypeScript strict
├── .env.example                         # template das variáveis de ambiente
│
├── docs/
│   ├── USER_GUIDE.md                    # manual do professor
│   └── ARCHITECTURE.md                  # documentação técnica detalhada
│
└── src/
    ├── theme.ts                         # design tokens (cores, spacing, radius)
    │
    ├── types/
    │   └── index.ts                     # Exam, Question, Correction, QuestionType
    │
    ├── services/
    │   ├── storage.ts                   # CRUD em AsyncStorage
    │   ├── geminiVision.ts              # cliente Gemini Vision com responseSchema
    │   └── csvExport.ts                 # geração e compartilhamento de CSV
    │
    ├── utils/
    │   └── grading.ts                   # cálculo de nota ponderada 0–10
    │
    ├── components/
    │   ├── AnswerCell.tsx               # célula clicável A/B/C/D/E/V/F
    │   ├── QuestionRow.tsx              # editor de uma questão
    │   ├── StatCard.tsx                 # card de métrica
    │   ├── ScoreBadge.tsx               # badge colorido com a nota
    │   ├── EmptyState.tsx               # estado vazio com emoji + CTA
    │   └── SectionHeader.tsx            # cabeçalho de seção tipográfico
    │
    ├── navigation/
    │   └── AppNavigator.tsx             # stack tipado (RootStackParamList)
    │
    └── screens/
        ├── HomeScreen.tsx               # dashboard + lista de provas
        ├── CreateExamScreen.tsx         # cadastro de prova com questões
        ├── ExamDetailScreen.tsx         # gabarito + correções + exportar
        ├── CaptureScreen.tsx            # nome do aluno + fotos
        ├── ReviewScreen.tsx             # revisão das respostas detectadas
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

interface Exam {
  id: string;
  name: string;
  className: string;       // turma
  createdAt: string;       // ISO 8601
  questions: Question[];
}

interface Correction {
  id: string;
  examId: string;
  studentName: string;
  photoUris: string[];
  detectedAnswers: Record<string, string>;  // questionId → 'A'|'B'|...|'?'
  score: number;                            // 0-10
  hits: number;
  misses: number;
  correctedAt: string;                      // ISO 8601
}
```

### Cálculo da nota

```
totalPeso = Σ question.weight
notaPonderada = Σ question.weight (onde detectado === correto)
nota = (notaPonderada / totalPeso) * 10
```

A nota é arredondada para **uma casa decimal**, no padrão brasileiro (0–10).

### Classificação

| Nota | Status | Cor |
|---|---|---|
| ≥ 7,0 | Aprovado | Verde (`#16a34a`) |
| 5,0 – 6,9 | Recuperação | Amarelo (`#d97706`) |
| < 5,0 | Reprovado | Vermelho (`#dc2626`) |

---

## 🔒 Privacidade e segurança

- **Dados armazenados localmente** no AsyncStorage do dispositivo. Nada é enviado a servidores próprios.
- **Imagens enviadas ao Google Gemini** apenas durante a correção. O Google declara não usar dados pagos da API para treinar modelos. Para usuários do tier gratuito, recomendamos consultar a [política de uso de dados do Google AI Studio](https://ai.google.dev/gemini-api/terms).
- **Chave de API**: para distribuição em loja, mover a chamada do Gemini para um backend proxy próprio (a chave `EXPO_PUBLIC_*` fica visível no bundle).
- **Direito do aluno**: o professor é responsável pela LGPD ao fotografar provas com identificação pessoal. Recomendação: borrar nomes na captura quando não forem necessários.

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
