# 📖 Manual do Professor — Prova Fácil

Bem-vindo(a) ao Prova Fácil! Este guia mostra como usar o app no dia a dia para corrigir provas escolares em poucos minutos.

> ⏱ **Tempo estimado para corrigir 30 provas com 10 questões:** ~12 minutos.

---

## Sumário

1. [Começando](#1-começando)
2. [Cadastrando uma prova](#2-cadastrando-uma-prova)
3. [Corrigindo um aluno](#3-corrigindo-um-aluno)
4. [Visualizando os resultados da turma](#4-visualizando-os-resultados-da-turma)
5. [Exportando notas em CSV](#5-exportando-notas-em-csv)
6. [Dicas para melhor leitura por IA](#6-dicas-para-melhor-leitura-por-ia)
7. [Solução de problemas](#7-solução-de-problemas)

---

## 1. Começando

Após instalar o app e configurar a chave da API (veja o [README](../README.md)), você verá a tela inicial:

```
┌──────────────────────────────┐
│   👋 Olá, professor          │
│   Resumo das suas correções  │
│                              │
│  ┌─────┐ ┌─────┐ ┌─────┐     │
│  │  3  │ │ 24  │ │ 7,2 │     │
│  │Provas│ │Corr.│ │Média│     │
│  └─────┘ └─────┘ └─────┘     │
│                              │
│  SUAS AVALIAÇÕES             │
│  ┌──────────────────────┐    │
│  │ Turma 9A      7,2 ⭐  │    │
│  │ Matemática 1º Bim    │    │
│  │ 10 questões • 12 alu │    │
│  └──────────────────────┘    │
│                              │
│              ╭──────────╮    │
│              │+ Nova Prova│  │
│              ╰──────────╯    │
└──────────────────────────────┘
```

- O **topo** mostra um resumo de todas as suas atividades.
- **Cada card** representa uma prova cadastrada – toque para ver detalhes.
- O **botão flutuante** "+ Nova Prova" cria uma nova avaliação.

---

## 2. Cadastrando uma prova

1. Toque em **+ Nova Prova**.
2. Preencha:
   - **Nome da prova** (ex.: "Matemática 1º Bimestre").
   - **Turma** (ex.: "9A").
3. Para cada questão, configure:
   - **Tipo** – Múltipla A-E, Múltipla A-D ou V/F.
   - **Resposta correta** – toque na alternativa correta (fica verde).
   - **Peso** – valor numérico. Pode ser decimal (ex.: 0,5).
4. Toque em **+ Adicionar questão** para incluir mais.
5. Use o botão **⚖ Distribuir = 10** para dividir os pesos automaticamente em soma 10.
6. Toque em **Salvar prova** quando terminar.

> 💡 **Dica:** o app aceita qualquer soma de pesos. Se a soma der 30, o app calcula proporcionalmente. Mas quando a soma é 10, o peso de cada questão equivale ao peso na nota final – mais fácil de comunicar com os alunos.

### Exemplo: prova de 5 questões

| # | Tipo | Resposta | Peso |
|---|------|----------|------|
| 1 | Múltipla A-E | C | 2 |
| 2 | Múltipla A-E | A | 2 |
| 3 | Múltipla A-D | B | 2 |
| 4 | V/F | V | 2 |
| 5 | V/F | F | 2 |
| **Total** | | | **10** |

Cada questão vale 2 pontos. Se o aluno acertar 4 das 5, sua nota será **8,0**.

---

## 3. Corrigindo um aluno

A partir do detalhe da prova, toque em **📷 Corrigir aluno**.

### Passo 1 – Identificar o aluno

Digite o nome completo do aluno. Esse nome aparecerá no boletim CSV exportado.

### Passo 2 – Fotografar a prova

Você tem duas opções:

| Opção | Quando usar |
|---|---|
| **📷 Tirar foto** | Você está com a prova física na mão (cenário comum) |
| **🖼 Galeria** | A prova já foi fotografada antes ou foi enviada por WhatsApp |

Você pode adicionar **várias fotos** se a prova tiver mais de uma página (ex.: prova de 20 questões em duas folhas).

### Passo 3 – Aguardar a IA

O app envia as fotos ao Google Gemini, que identifica as marcações. Geralmente leva **3 a 8 segundos**.

Enquanto isso, você verá a tela:

```
   ⏳ Analisando com IA
   Lendo as marcações nas 2 fotos...
```

### Passo 4 – Revisar as respostas detectadas

A tela de revisão mostra todas as questões com a alternativa que a IA detectou:

- 🟦 **Azul** – alternativa que a IA considerou marcada.
- ⚪ **Cinza** – alternativas não marcadas.
- ⚠️ **Chip "verificar"** – aparece em questões onde a IA não conseguiu identificar com confiança (rasura, em branco, fora do enquadramento). **Você precisa verificar essas manualmente.**

Para alterar:
- **Toque** em uma alternativa para selecioná-la.
- **Toque novamente** na mesma alternativa para desmarcar.
- **Toque no "?"** se quiser deixar sem resposta (será considerada errada).

> 🎯 **Boa prática:** sempre revise as questões marcadas como "verificar" – a IA é boa, mas não infalível. Em rasuras complexas, sua decisão prevalece.

### Passo 5 – Calcular a nota

Toque em **🧮 Calcular nota**. A tela de resultado mostra:

- **Nota grande** colorida (verde / amarelo / vermelho conforme aprovação).
- **Status**: APROVADO / RECUPERAÇÃO / REPROVADO.
- **Detalhe por questão** – o que o aluno marcou e o que era esperado.

### Passo 6 – Salvar

Toque em **✓ Salvar correção**. Você volta automaticamente para o detalhe da prova com a nota do aluno listada.

---

## 4. Visualizando os resultados da turma

No detalhe da prova, você vê:

- **Estatísticas da turma**: média, melhor nota, percentual de aprovados.
- **Gabarito oficial** – referência rápida.
- **Lista de correções** – todos os alunos já corrigidos, com nota colorida.

Cada linha mostra:
- Avatar com a inicial do nome.
- Nome do aluno.
- Quantidade de acertos e erros + data.
- **Badge da nota** (verde se ≥ 7,0, amarelo se ≥ 5,0, vermelho se < 5,0).

---

## 5. Exportando notas em CSV

No detalhe da prova, toque em **⬇ CSV**.

O iOS abre a tela de compartilhamento. Você pode enviar para:

- 💬 **WhatsApp** – para a coordenação ou pais.
- 📧 **E-mail** – para si mesmo ou colegas.
- 📁 **Google Drive / iCloud** – para arquivar.
- 💻 **AirDrop** – para abrir no Excel/Numbers do Mac.

### Formato do CSV

```csv
Aluno,Nota,Acertos,Erros,Data
João Silva,8,0,8,2,01/03/2026
Maria Souza,7,5,7,3,01/03/2026
Pedro Lima,5,5,5,5,02/03/2026
```

Abre direto em Excel, Google Sheets ou Numbers.

---

## 6. Dicas para melhor leitura por IA

A qualidade da detecção depende muito de como a foto é tirada. Siga estas dicas para máxima precisão:

| ✅ Boas práticas | ❌ Evite |
|---|---|
| Luz natural ou iluminação uniforme | Sombras parciais sobre a folha |
| Folha apoiada em superfície plana | Folha amassada ou dobrada |
| Foto perpendicular à folha | Foto inclinada (perspectiva extrema) |
| Toda a folha enquadrada | Cortes em parte da prova |
| Marcações em caneta ou lápis bem traçado | Marcações muito leves ou apagadas |
| Uma página por foto (se houver várias) | Tentar caber duas páginas em uma foto |

> 📝 **Importante:** se o aluno **rasurou** uma alternativa para mudar de resposta, a IA pode ficar em dúvida. Esses casos aparecem como "verificar" – revise visualmente e decida.

---

## 7. Solução de problemas

### "Chave da API não configurada"

A IA não pode rodar sem a chave do Google Gemini.

**Solução:**
1. Acesse [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Crie uma chave gratuita (precisa de conta Google).
3. Copie e cole no arquivo `.env` do projeto:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=AIza...
   ```
4. Reinicie o app: `Ctrl+C` no terminal e `npx expo start --clear`.

> Mesmo sem a chave, o app abre normal e você consegue cadastrar provas e corrigir manualmente. Só a detecção automática fica desabilitada.

### "Falha ao chamar a IA"

Possíveis causas:
- Sem internet no momento da correção.
- Quota da API esgotada (tier gratuito tem ~15 requisições/minuto).
- Foto muito grande – o app já reduz, mas se houver problema, tire a foto novamente.

A tela de revisão sempre permite preenchimento manual como fallback.

### "A IA está detectando errado"

- **Tire fotos com mais luz e sem inclinação.**
- **Verifique o gabarito** – se o tipo da questão estiver errado (ex.: você cadastrou A–E mas a prova tem A–D), a IA pode confundir.
- **Use a tela de revisão** – ajustar com o dedo é rápido. A IA acerta a maioria; você corrige o resto.

### "Esqueci de adicionar uma questão"

Atualmente o MVP não permite editar uma prova depois de salva (apenas excluir e recriar). Esta funcionalidade está prevista para a Fase 2.

### "Como faço backup das notas?"

Exporte CSV da turma regularmente. Esse arquivo é o backup canônico das notas. O AsyncStorage do iOS preserva os dados entre execuções, mas se você desinstalar o app, perde tudo – por isso o CSV é importante.

---

## 🎓 Bom uso e boa correção!

Se tiver sugestões ou encontrar bugs, abra uma issue no repositório.
