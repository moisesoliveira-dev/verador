# 🤖 Verador Chatbot

Sistema de chatbot inteligente para integração com GOSAC, desenvolvido com NestJS. Projetado para gerenciar tickets, atender usuários e supervisionar estados de clientes de forma dinâmica e escalável.

## ✨ Características Principais

- **Fluxo Dinâmico**: Sistema de conversação baseado em etapas configuráveis
- **Debounce Inteligente**: Previne spam e mensagens duplicadas
- **Validação Robusta**: Sistema de validação flexível para diferentes tipos de entrada
- **Rate Limiting**: Proteção contra abuso com throttling configurável
- **Integração GOSAC**: Pronto para integrar com APIs do sistema GOSAC
- **Escalável**: Preparado para múltiplos usuários simultâneos
- **Logs Detalhados**: Sistema de logging completo para monitoramento
- **Controle de Estado**: Gerenciamento inteligente do estado das conversas

## 🚀 Funcionalidades

### Chatbot Core
- ✅ Mensagem de boas-vindas personalizada
- ✅ Navegação por índices numéricos
- ✅ Comandos de controle (voltar, reiniciar)
- ✅ Sistema de validação de entrada
- ✅ Controle de tentativas e timeouts
- ✅ Prevenção de mensagens repetidas
- ✅ Debounce para evitar spam

### Gerenciamento de Estado
- ✅ Estado persistente de conversas
- ✅ Histórico de navegação
- ✅ Limpeza automática de sessões expiradas
- ✅ Armazenamento de dados contextuais

### Integração GOSAC
- ✅ Estrutura base para APIs do GOSAC
- ✅ Envio de mensagens
- ✅ Criação e atualização de tickets
- ✅ Gerenciamento de status de usuários
- ✅ Processamento de webhooks

### APIs RESTful
- ✅ Endpoint principal para mensagens
- ✅ Webhook para integração GOSAC
- ✅ Consulta de estado de conversas
- ✅ Histórico de mensagens
- ✅ Estatísticas do sistema
- ✅ Health check

## 🛠️ Tecnologias

- **Framework**: NestJS
- **Linguagem**: TypeScript
- **Validação**: class-validator, class-transformer
- **Rate Limiting**: @nestjs/throttler
- **HTTP Client**: Axios
- **Configuração**: @nestjs/config
- **Logs**: Logger nativo do NestJS

## 📦 Instalação

1. **Clone o repositório**
   ```bash
   git clone <seu-repositorio>
   cd verador
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Execute o projeto**
   ```bash
   # Desenvolvimento
   npm run start:dev
   
   # Produção
   npm run build
   npm run start:prod
   ```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Servidor
PORT=3000
NODE_ENV=development

# GOSAC API
GOSAC_API_URL=https://api.gosac.com
GOSAC_API_KEY=your_api_key

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=30

# Chatbot
CHATBOT_DEBOUNCE_TIME=2000
CHATBOT_MAX_ATTEMPTS=3
```

## 🔌 Endpoints da API

### Chatbot

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/chatbot/message` | Enviar mensagem para o chatbot |
| POST | `/api/v1/chatbot/webhook/gosac` | Webhook para integração GOSAC |
| GET | `/api/v1/chatbot/conversation/:userId` | Estado da conversa |
| POST | `/api/v1/chatbot/conversation/:userId/restart` | Reiniciar conversa |
| GET | `/api/v1/chatbot/conversation/:userId/history` | Histórico de mensagens |
| GET | `/api/v1/chatbot/stats` | Estatísticas do sistema |
| GET | `/api/v1/chatbot/health` | Health check |

### Exemplo de Uso

**Enviar mensagem:**
```bash
curl -X POST http://localhost:3000/api/v1/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "Olá"
  }'
```

**Resposta:**
```json
{
  "message": "🤖 *Olá! Bem-vindo(a) ao Verador Bot!*\n\nSou seu assistente virtual...",
  "options": [
    "1. 🎫 Gerenciar Tickets",
    "2. 📊 Status do Sistema",
    "3. ❓ Ajuda"
  ]
}
```

## 🏗️ Arquitetura

```
src/
├── chatbot/                 # Módulo principal do chatbot
│   ├── controllers/         # Controllers REST
│   ├── services/           # Lógica de negócio
│   ├── interfaces/         # Interfaces TypeScript
│   ├── dto/               # Data Transfer Objects
│   └── flow/              # Definições de fluxo
├── gosac/                 # Integração com GOSAC
│   ├── gosac.service.ts   # Cliente API GOSAC
│   └── gosac.interface.ts # Interfaces GOSAC
├── common/                # Utilitários compartilhados
└── main.ts               # Ponto de entrada
```

### Fluxo de Conversação

1. **Usuário envia mensagem** → Endpoint `/chatbot/message`
2. **Validação e sanitização** → ValidationService
3. **Processamento de estado** → ConversationStateService
4. **Execução de fluxo** → FlowService
5. **Resposta formatada** → ChatbotService
6. **Integração GOSAC** → GosacService (quando necessário)

## 🎯 Comandos de Controle

- **Números (1, 2, 3...)**: Navegar pelas opções
- **0**: Voltar ao passo anterior
- **#**: Recomeçar desde o início
- **Palavras-chave**: `voltar`, `inicio`, `recomecar`

## 🚦 Rate Limiting

- **Mensagens**: 10 por minuto por IP
- **Consultas**: 20 por minuto por IP
- **Reinicializações**: 5 por minuto por IP
- **Stats/Health**: 30-60 por minuto por IP

## 🧪 Desenvolvimento

### Adicionando Novos Fluxos

1. **Defina o passo** no `FlowService`:
```typescript
this.addStep({
  id: 'novo_passo',
  name: 'Novo Passo',
  message: 'Mensagem do passo',
  options: [
    { key: 'opcao1', text: 'Opção 1', nextStep: 'proximo_passo' }
  ],
  validation: {
    type: 'text',
    required: true
  }
});
```

2. **Implemente validação customizada**:
```typescript
validation: {
  type: 'custom',
  customValidator: (value: string) => value.length > 5,
  errorMessage: 'Deve ter mais de 5 caracteres'
}
```

3. **Adicione ações**:
```typescript
action: async (userInput: string, state: ConversationState) => {
  // Salvar dados, chamar APIs, etc.
  state.data.userInput = userInput;
}
```

### Adicionando Integrações GOSAC

```typescript
// Enviar mensagem
await this.gosacService.sendMessage({
  to: userId,
  message: 'Sua mensagem'
});

// Criar ticket
await this.gosacService.createTicket({
  userId,
  subject: 'Assunto',
  description: 'Descrição',
  priority: 'high'
});
```

## 🚀 Deploy no Railway

1. **Conecte seu repositório** no Railway
2. **Configure as variáveis de ambiente**
3. **O Railway detectará automaticamente** o projeto NestJS
4. **Configure o PostgreSQL** se necessário
5. **Deploy automático** a cada push

### Configuração Railway

```json
{
  "build": {
    "command": "npm run build"
  },
  "start": {
    "command": "npm run start:prod"
  }
}
```

## 📊 Monitoramento

### Logs
- Todas as interações são logadas
- Níveis configuráveis (debug, info, warn, error)
- Logs estruturados para análise

### Métricas
- Conversas ativas
- Total de usuários
- Estatísticas por passo
- Performance de resposta

### Health Check
```bash
curl http://localhost:3000/api/v1/chatbot/health
```

## 🔮 Próximos Passos

- [ ] Integração com banco PostgreSQL
- [ ] Implementação completa da API GOSAC
- [ ] Sistema de notificações
- [ ] Dashboard de administração
- [ ] Métricas avançadas
- [ ] Testes automatizados
- [ ] Documentação Swagger

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença [UNLICENSED](LICENSE).

---

**Desenvolvido com ❤️ para integração com GOSAC**
