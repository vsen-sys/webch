# Frontend - CS2 Offsets Manager

## Visao Geral
Interface visual do site CS2 Offsets Manager com design dark/neon.

## Estrutura

```
frontend/
├── index.html      # Pagina principal
├── css/
│   └── style.css   # Estilos
├── js/
│   └── script.js   # Logica
├── assets/         # Imagens e icones
└── README.md       # Esta documentacao
```

## Funcionalidades

1. **Exibicao de Offsets**
   - Tabela com todas as offsets do CS2
   - Organizacao por categoria
   - Copia com um clique

2. **Busca**
   - Busca por nome
   - Busca por valor
   - Filtros por categoria

3. **Status do Sistema**
   - Indicadores de status
   - Estatisticas em tempo real

4. **Design**
   - Tema dark/neon (CS2)
   - Responsivo
   - Animacoes suaves

## Categorias de Offsets

- **Jogador** - Dados do jogador (vida, posicao, etc)
- **Arma** - Dados da arma (municao, proximo tiro)
- **Camera** - Dados da camera (view matrix, angulos)
- **Jogo** - Dados do jogo (entity list, global vars)
- **Misc** - Outros dados

## Como Usar

1. Abra `index.html` no navegador
2. Use a barra de busca para encontrar offsets
3. Filtre por categoria usando os botoes
4. Clique em "Copiar" para copiar o valor

## Integracao com Backend

O frontend se comunica com a API backend em:
- `http://localhost:3000/api/offsets/cs2`

Se a API não estiver disponível, dados de exemplo são carregados automaticamente.

## Tecnologias

- HTML5
- CSS3 (com CSS Variables)
- JavaScript Vanilla
