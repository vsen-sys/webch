# COMO FUNCIONA O SISTEMA

## Visao Geral

Voce tem 4 agentes OpenCode trabalhando como uma equipe coordenada. Cada agente tem uma funcao especifica e trabalham juntos para criar o site.

## Os 4 Agentes

### 🔹 Agente 1 - Frontend (Visual)
- Cria a aparencia do site
- HTML, CSS, JavaScript
- Design responsivo
- Animacoes e efeitos

### 🔹 Agente 2 - Pesquisador
- Procura offsets de jogos na web
- Valida informacoes
- Organiza dados em JSON
- Entrega ao backend

### 🔹 Agente 3 - Backend
- Cria servidor e API
- Gerencia banco de dados
- Processa offsets
- Fornece dados ao frontend

### 🔹 Agente 4 - QA/Tester
- Testa todo o sistema
- Encontra bugs
- Corrige problemas
- Atualiza offsets

## Fluxo de Trabalho

```
Voce (Comandante)
      ↓
   Atribui tarefa
      ↓
┌─────────────────────────────────────┐
│  Agente 2    →    Agente 3    →    Agente 1
│ (pesquisa)      (backend)        (frontend)
│                     ↓
│               Agente 4 (testes)
└─────────────────────────────────────┘
      ↓
   Resultado final
```

## Como Dar Ordens

### Exemplos de Comandos

**Para criar o visual:**
```
"Agente 1, crie a pagina inicial do site"
```

**Para pesquisar offsets:**
```
"Agente 2, pesquise as offsets do jogo X"
```

**Para criar backend:**
```
"Agente 3, crie uma API para servir os dados"
```

**Para testar:**
```
"Agente 4, teste se tudo esta funcionando"
```

## Estrutura de Pastas

```
webch/
├── GUIA OBRIGATORIO/    ← Regras
├── frontend/            ← Visual do site
├── backend/             ← Logica do servidor
├── offsets/             ← Dados de jogos
├── bugs/                ← Problemas encontrados
└── docs/                ← Documentacao
```

## Importante

- Cada agente trabalha na sua pasta
- Eles se comunicam via arquivos
- Voce coordena tudo via comandos
- O Agente 4 testa e reporta bugs
- Bugs sao corrigidos pelos agentes responsaveis
