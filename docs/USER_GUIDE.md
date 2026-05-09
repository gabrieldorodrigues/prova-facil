# 📖 Manual do Professor — Prova Fácil

Bem-vindo(a) ao Prova Fácil! Este guia mostra como usar o app no dia a dia para corrigir provas escolares em poucos minutos.

---

## Sumário

1. [Começando](#1-começando)
2. [Cadastrando turmas e alunos](#2-cadastrando-turmas-e-alunos)
3. [Cadastrando uma prova](#3-cadastrando-uma-prova)
4. [Corrigindo um aluno por vez](#4-corrigindo-um-aluno-por-vez)
5. [Correção em lote](#5-correção-em-lote)
6. [Visualizando os resultados da turma](#6-visualizando-os-resultados-da-turma)
7. [Editando uma prova](#7-editando-uma-prova)
8. [Exportando notas em CSV](#8-exportando-notas-em-csv)
9. [Dicas para melhor leitura por IA](#9-dicas-para-melhor-leitura-por-ia)
10. [Solução de problemas](#10-solução-de-problemas)

---

## 1. Começando

Após instalar o app e configurar a chave da API (veja o [README](../README.md)), você verá a tela inicial com **3 abas no rodapé**:

- **Início** — dashboard com estatísticas, ações rápidas e provas recentes.
- **Turmas** — gestão das turmas e alunos.
- **Provas** — lista completa das avaliações cadastradas.

```
┌──────────────────────────────────────┐
│ 👋 Olá, professor                    │
│ Resumo das suas correções            │
│                                      │
│ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │ Turmas │ │ Provas │ │ Média  │     │
│ │   2    │ │   3    │ │  7,2   │     │
│ └────────┘ └────────┘ └────────┘     │
│                                      │
│ AÇÕES RÁPIDAS                        │
│ ┌──────────────┐ ┌──────────────┐    │
│ │  🏫          │ │  📝          │    │
│ │  Nova turma  │ │  Nova prova  │    │
│ └──────────────┘ └──────────────┘    │
│                                      │
│ PROVAS RECENTES        [Ver todas]   │
│ ┌──────────────────────────────┐     │
│ │ 9A · Matemática 1º Bim 7,2 ⭐ │     │
│ │ 10 questões • 12 alunos      │     │
│ └──────────────────────────────┘     │
├──────────────────────────────────────┤
│  Início    Turmas    Provas          │
└──────────────────────────────────────┘
```

- **Stats** no topo: turmas, provas e média geral.
- **Ações rápidas**: atalhos para criar turma ou prova.
- **Provas recentes**: 3 últimas; toque pra abrir detalhe.

> Antes de cadastrar a primeira prova, **cadastre suas turmas e alunos** — assim a IA consegue identificar automaticamente quem fez cada prova e a navegação fica mais fluida.

---

## 2. Cadastrando turmas e alunos

### Criar turma

Há duas formas:
- Aba **Turmas** → toque no FAB **+ Nova turma**.
- Aba **Início** → ação rápida **🏫 Nova turma** (abre o mesmo dialog automaticamente).

Digite o nome (ex.: "9º A — Manhã") e toque em **Criar**.

### Adicionar alunos a uma turma

1. Aba **Turmas** → toque na turma desejada.
2. Toque em **+ Adicionar** ao lado de "Alunos".
3. Digite o nome do aluno e toque em **Adicionar**.
4. Repita para cada aluno.

> 📋 **Dica:** quanto mais completa a lista de alunos, melhor a identificação automática na correção em lote (a IA tenta casar o nome lido com a lista da turma).

### Excluir turma ou aluno

- Na tela de detalhe da turma, ícone de lixeira no topo apaga a turma (com confirmação).
- Toque em **Remover** ao lado de cada aluno na lista.

> ⚠️ Excluir uma turma apaga **todos os alunos** dela. Provas atribuídas só àquela turma também são removidas, e suas correções junto. Provas em múltiplas turmas continuam, perdendo só o vínculo com a turma deletada.

---

## 3. Cadastrando uma prova

1. Aba **Início** → ação rápida **📝 Nova prova**, ou aba **Provas** → FAB **+ Nova prova**.
2. Preencha:
   - **Nome da prova** (ex.: "Matemática 1º Bimestre").
   - **Turmas** – toque em "Adicionar turmas" e selecione **uma ou mais**. Pode criar uma nova turma direto desse dialog.
3. Para cada questão, configure:
   - **Tipo** – Múltipla A-E, Múltipla A-D ou V/F (segmented control).
   - **Resposta correta** – toque na alternativa correta (fica verde).
   - **Peso** – valor numérico. Pode ser decimal (ex.: 0,5).
4. Toque em **+ Adicionar questão** para incluir mais.
5. Use o botão **⚖ Distribuir = 10** para dividir os pesos automaticamente em soma 10.
6. Toque em **💾 Salvar prova** quando terminar.

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

## 4. Corrigindo um aluno por vez

Use quando você tem só uma ou duas provas pra corrigir, ou quando quer revisar com calma uma a uma.

A partir do detalhe da prova, toque em **👤 Corrigir um aluno por vez**.

### Passo 1 – Selecionar o aluno

Toque em **Selecionar aluno**. Aparece a lista de alunos das turmas atribuídas à prova, agrupados por turma.

- Toque no aluno desejado.
- Se o aluno não estiver cadastrado, toque em **＋ Adicionar aluno** no rodapé do dialog para criá-lo na hora.

### Passo 2 – Fotografar a prova

Duas opções:

| Opção | Quando usar |
|---|---|
| **📷 Tirar foto** | Você está com a prova física na mão (cenário comum) |
| **🖼 Galeria** | A prova já foi fotografada antes ou foi enviada por WhatsApp |

Várias fotos se a prova tiver mais de uma página.

### Passo 3 – Continuar para revisão

Toque em **Continuar para revisão →**. O app envia as fotos ao Gemini.

### Passo 4 – Aguardar a IA

```
   ⏳ Analisando com IA
   Lendo as marcações nas 2 fotos...
```

Geralmente leva **3 a 8 segundos** por prova.

### Passo 5 – Revisar as respostas detectadas

A tela de revisão mostra todas as questões com a alternativa que a IA detectou:

- 🟦 **Azul** – alternativa que a IA considerou marcada.
- ⚪ **Cinza** – alternativas não marcadas.
- ⚠️ **Chip "verificar"** – questões onde a IA não conseguiu identificar com confiança (rasura, em branco, fora do enquadramento). **Você precisa verificar essas manualmente.**

Para alterar:
- **Toque** em uma alternativa para selecioná-la.
- **Toque novamente** na mesma alternativa para desmarcar.
- **Toque no "?"** se quiser deixar sem resposta (será considerada errada).

> 🎯 **Boa prática:** sempre revise as questões marcadas como "verificar" – a IA é boa, mas não infalível. Em rasuras complexas, sua decisão prevalece.

### Passo 6 – Calcular a nota

Toque em **🧮 Calcular nota**. A tela de resultado mostra:

- **Nota grande** colorida (verde / amarelo / vermelho conforme aprovação).
- **Status**: APROVADO / RECUPERAÇÃO / REPROVADO.
- **Detalhe por questão** – o que o aluno marcou e o que era esperado.

### Passo 7 – Salvar

Toque em **✓ Salvar correção**. Você volta automaticamente para o detalhe da prova com a nota do aluno listada.

---

## 5. Correção em lote

Use quando você tem várias provas da **mesma turma** pra corrigir de uma vez. A IA tenta identificar automaticamente o nome de cada aluno no cabeçalho.

A partir do detalhe da prova, toque em **✨ Corrigir em lote**.

### Passo 1 – Selecionar a turma do lote

Se a prova foi atribuída a uma única turma, ela já vem selecionada. Se há mais de uma, toque em "Selecionar" e escolha.

### Passo 2 – Adicionar fotos

- **📷 Câmera** — fotografe cada prova em sequência.
- **🖼 Galeria** — selecione várias fotos de uma vez.

Cada foto é uma prova de um aluno. Use o **X vermelho** para remover fotos erradas.

### Passo 3 – Processar com IA

Toque em **Processar com IA ✨**. O app processa as fotos em paralelo. Você vê uma barra de progresso "X de Y processadas".

### Passo 4 – Revisar o lote

Cada prova vira um card mostrando:
- **Foto** + número da prova.
- **Nome detectado** — quando a IA leu e o app encontrou correspondência na turma, aparece o nome do aluno em destaque.
- **⚠ Aluno não identificado** — IA não leu o nome ou não casou com nenhum aluno cadastrado. Tem o aviso "IA leu: '...' — sem match na turma".
- **Nota provisória** (calculada com as respostas detectadas).

No rodapé de cada card:
- **Trocar/Selecionar aluno** — abre dialog de seleção (lista alunos da turma; mostra "já em uso" para alunos já vinculados a outra entrada).
- **Editar respostas** — abre a tela individual de Resultado, onde você pode ajustar respostas e ver detalhe.

Use o **X** ao lado da nota pra descartar uma entrada (foto borrada, aluno errado etc.).

### Passo 5 – Salvar tudo

Toque em **Salvar X correção(ões) ✓✓**. Se houver entradas sem aluno selecionado, o app pergunta se você quer salvar mesmo assim (vão ficar sem aluno identificado e podem ser atribuídas depois).

> 🚀 **Dica de produtividade:** com fotos boas, o lote de 30 provas leva ~12 minutos no total — a IA acerta a maioria, e você só revisa os casos duvidosos.

---

## 6. Visualizando os resultados da turma

No detalhe da prova, você vê:

- **Estatísticas globais**: média, melhor nota, aprovados.
- **Botões de ação**: Corrigir em lote / CSV / Corrigir um aluno por vez.
- **Gabarito oficial** – referência rápida com as respostas certas.
- **Correções por turma** – cada turma vinculada vira um grupo, com:
  - Avatar e média da turma.
  - Lista de alunos corrigidos com badge de nota colorida.
- **Sem aluno identificado** – grupo separado para correções em lote sem match (você pode reabrir e atribuir).

---

## 7. Editando uma prova

Não precisa apagar e refazer. No detalhe da prova, toque no ícone de **lápis** no canto superior direito.

Você pode mudar:
- Nome da prova.
- Turmas atribuídas (adicionar/remover).
- Adicionar, remover ou ajustar questões e pesos.

> ⚠️ **Atenção:** alterar o gabarito **não recalcula correções já feitas**. As notas existentes ficam congeladas como estavam quando foram salvas. Se quiser recalcular, exclua a correção e refaça.

---

## 8. Exportando notas em CSV

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

## 9. Dicas para melhor leitura por IA

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

## 10. Solução de problemas

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

Toque no ícone de **lápis** no detalhe da prova para editar — veja [seção 7](#7-editando-uma-prova). Lembre-se: alterar o gabarito **não recalcula correções já feitas**.

### "A IA leu o nome do aluno errado no lote"

Na tela de revisão do lote:
- Aluno cadastrado mas IA leu errado → toque em **Trocar aluno** e selecione o correto.
- Aluno não cadastrado → cadastre na aba Turmas e refaça o lote, ou salve sem aluno e atribua depois.
- Causas frequentes: cabeçalho rasurado, letra ilegível, nome cortado pelo enquadramento. Tire fotos com cabeçalho bem visível.

### "Como faço backup das notas?"

Exporte CSV da turma regularmente. Esse arquivo é o backup canônico das notas. O AsyncStorage do iOS preserva os dados entre execuções, mas se você desinstalar o app, perde tudo – por isso o CSV é importante.

---

## 🎓 Bom uso e boa correção!

Se tiver sugestões ou encontrar bugs, abra uma issue no repositório.
