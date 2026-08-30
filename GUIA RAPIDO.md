# GUIA RAPIDO - COMO USAR O SISTEMA

## Para o Comandante (Usuario)

### Iniciar uma Tarefa
1. Digite qual tarefa quer que seja feita
2. Escolha qual agente deve fazer (1, 2, 3 ou 4)
3. O sistema vai coordenar automaticamente

### Exemplos de Comandos

**Criar visual do site:**
```
"Agente 1, crie a pagina inicial do site com um layout moderno"
```

**Pesquisar offsets:**
```
"Agente 2, pesquise as offsets do jogo [nome do jogo]"
```

**Criar backend:**
```
"Agente 3, crie uma API para servir as offsets"
```

**Testar sistema:**
```
"Agente 4, teste se o site esta funcionando corretamente"
```

---

## Para os Agentes

### Ao Receber uma Tarefa
1. Leia as instrucoes na sua pasta
2. Execute a tarefa conforme solicitado
3. Salve seus arquivos na pasta correta
4. Notifique o Comandante quando terminar

### Comunicacao
- Use os arquivos `.md` na sua pasta para status
- Crie novos arquivos quando necessario
- Mantenha o LOG.md atualizado

---

## Estrutura de Pastas

```
webch/
├── GUIA OBRIGATORIO/    ← Leia primeiro
├── frontend/            ← Agente 1 trabalha aqui
├── backend/             ← Agente 3 trabalha aqui
├── offsets/             ← Agente 2 salva aqui
├── bugs/                ← Agente 4 reporta aqui
├── docs/                ← Documentacao geral
├── COMANDANTE.md        ← Como coordenar
├── STATUS.md            ← Status dos agentes
├── LOG.md               ← Historico de atividades
└── config.json          ← Configuracoes
```

---

## Dicas Importantes

1. **SEMPRE** salve arquivos na pasta correta
2. **COMUNIQUE** antes de fazer alteracoes
3. **DOCUMENTE** tudo que fizer
4. **TESTE** antes de entregar
5. **ATUALIZE** o status constantemente
