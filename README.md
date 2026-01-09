# Flight Deals Tracker

Sistema completo de rastreamento automático de ofertas de voos e cruzeiros com descontos significativos (50% a 90%).

## 🎯 Funcionalidades

### ✅ Gerenciamento de Regras
- **CRUD completo** de regras de monitoramento
- Configuração de origem, destino, datas e desconto mínimo
- Ativação/desativação de regras individuais
- Suporte para voos e cruzeiros

### 🔍 Busca Inteligente
- Integração com **Amadeus API** para busca de voos em tempo real
- Validação automática de ofertas antes de exibir
- Cálculo preciso de percentual de desconto
- Cache de resultados para otimização

### 📧 Notificações Configuráveis
- **Email** com template HTML formatado
- **Webhook** para integração com sistemas externos
- Notificações combinadas (email + webhook)
- Configuração por regra individual

### ⏰ Agendamento Automático
- Job diário executado às 9h da manhã
- Processamento de todas as regras ativas
- Envio automático de notificações
- Logs detalhados de execução

### 📊 Dashboard Completo
- Visão geral de regras ativas e ofertas encontradas
- Histórico completo de ofertas
- Logs de execução do job
- Interface intuitiva e responsiva

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + tRPC
- **Banco de Dados**: MySQL com Drizzle ORM
- **APIs**: Amadeus Flight Offers Search API
- **Autenticação**: Manus OAuth

## 📦 Estrutura do Banco de Dados

### Tabela: `monitoring_rules`
Armazena as regras de monitoramento criadas pelos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único da regra |
| userId | INT | ID do usuário proprietário |
| name | VARCHAR(255) | Nome da regra |
| type | ENUM | Tipo: "flight" ou "cruise" |
| origin | VARCHAR(100) | Código IATA de origem |
| destination | VARCHAR(100) | Código IATA de destino |
| departureDate | TIMESTAMP | Data de ida |
| returnDate | TIMESTAMP | Data de volta (opcional) |
| minDiscount | INT | Desconto mínimo (%) |
| notificationType | ENUM | "email", "webhook" ou "both" |
| notificationEmail | VARCHAR(320) | Email para notificação |
| notificationWebhook | TEXT | URL do webhook |
| isActive | BOOLEAN | Regra ativa/inativa |

### Tabela: `deals_history`
Armazena o histórico de ofertas encontradas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único da oferta |
| ruleId | INT | ID da regra que encontrou |
| userId | INT | ID do usuário |
| type | ENUM | "flight" ou "cruise" |
| title | VARCHAR(500) | Título da oferta |
| origin | VARCHAR(100) | Origem |
| destination | VARCHAR(100) | Destino |
| departureDate | TIMESTAMP | Data de ida |
| returnDate | TIMESTAMP | Data de volta |
| originalPrice | DECIMAL(10,2) | Preço original |
| currentPrice | DECIMAL(10,2) | Preço atual |
| discountPercentage | INT | Percentual de desconto |
| currency | VARCHAR(10) | Moeda |
| offerUrl | TEXT | Link da oferta |
| provider | VARCHAR(100) | Fornecedor |
| details | JSON | Metadados adicionais |
| isValid | BOOLEAN | Oferta válida |
| validatedAt | TIMESTAMP | Data de validação |
| notifiedAt | TIMESTAMP | Data de notificação |

### Tabela: `job_logs`
Registra execuções do job agendado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único do log |
| jobType | VARCHAR(100) | Tipo do job |
| status | ENUM | "success", "error" ou "running" |
| rulesProcessed | INT | Regras processadas |
| dealsFound | INT | Ofertas encontradas |
| notificationsSent | INT | Notificações enviadas |
| errorMessage | TEXT | Mensagem de erro |
| executionTime | INT | Tempo de execução (ms) |
| startedAt | TIMESTAMP | Início da execução |
| completedAt | TIMESTAMP | Fim da execução |

## 🚀 Como Usar

### 1. Criar uma Regra de Monitoramento

1. Acesse o dashboard
2. Clique em "Nova Regra"
3. Preencha os critérios:
   - Nome da regra
   - Tipo (voo ou cruzeiro)
   - Origem e destino (opcional)
   - Datas (opcional)
   - Desconto mínimo (%)
   - Tipo de notificação
   - Email ou webhook
4. Clique em "Criar Regra"

### 2. Visualizar Ofertas

- Acesse "Histórico de Ofertas" no menu
- Veja todas as ofertas encontradas
- Clique em "Ver Oferta" para acessar o link oficial

### 3. Executar Busca Manual

- Acesse "Logs de Execução" no menu
- Clique em "Executar Agora"
- Acompanhe o progresso em tempo real

### 4. Configurar Notificações

**Email:**
- Configure o email no formulário da regra
- Receberá um email formatado com todas as ofertas

**Webhook:**
- Configure a URL do webhook
- Receberá um POST com payload JSON:

```json
{
  "rule": {
    "id": 1,
    "name": "Voos para Europa",
    "type": "flight"
  },
  "deals": [
    {
      "title": "GRU → CDG",
      "origin": "GRU",
      "destination": "CDG",
      "departureDate": "2026-06-15T00:00:00.000Z",
      "originalPrice": 5000,
      "currentPrice": 2000,
      "discountPercentage": 60,
      "currency": "BRL",
      "offerUrl": "https://...",
      "provider": "Amadeus"
    }
  ],
  "timestamp": "2026-01-09T09:00:00.000Z"
}
```

## 📋 Endpoints da API

### Regras de Monitoramento

- `trpc.rules.list.useQuery()` - Lista todas as regras do usuário
- `trpc.rules.create.useMutation()` - Cria nova regra
- `trpc.rules.getById.useQuery({ id })` - Busca regra por ID
- `trpc.rules.update.useMutation({ id, data })` - Atualiza regra
- `trpc.rules.delete.useMutation({ id })` - Deleta regra
- `trpc.rules.toggleActive.useMutation({ id, isActive })` - Ativa/desativa regra

### Ofertas

- `trpc.deals.list.useQuery({ limit })` - Lista ofertas do usuário
- `trpc.deals.byRule.useQuery({ ruleId })` - Lista ofertas por regra

### Jobs

- `trpc.jobs.logs.useQuery({ limit })` - Lista logs de execução
- `trpc.jobs.runManual.useMutation()` - Executa job manualmente

## ⚙️ Configuração

### Variáveis de Ambiente

As seguintes variáveis são configuradas automaticamente:

- `AMADEUS_API_KEY` - Chave da API Amadeus
- `AMADEUS_API_SECRET` - Secret da API Amadeus
- `DATABASE_URL` - URL de conexão do MySQL
- `JWT_SECRET` - Secret para sessões

### Agendamento

O job está configurado para executar **diariamente às 9h da manhã**.

Para alterar o horário, edite o cron expression no código:
```typescript
// 0 0 9 * * * = Todos os dias às 9h
// 0 0 */6 * * * = A cada 6 horas
// 0 30 8 * * 1-5 = Seg-Sex às 8:30
```

## 🧪 Testes

Execute os testes com:

```bash
pnpm test
```

Testes disponíveis:
- ✅ CRUD de regras de monitoramento
- ✅ Integração com Amadeus API
- ✅ Validação de credenciais

## 📝 Notas Importantes

### Limitações da API Amadeus (Ambiente de Teste)

- Voos de companhias de baixo custo não disponíveis
- American Airlines, Delta e British Airways não disponíveis
- Dados limitados no ambiente de teste
- Para produção, é necessário migrar para o ambiente de produção

### Busca de Cruzeiros

A busca de cruzeiros está preparada mas aguarda integração com API específica. Atualmente retorna lista vazia.

### Notificações por Email

O sistema está preparado para envio de emails, mas requer configuração de serviço SMTP (SendGrid, AWS SES, etc.) para funcionar em produção.

## 🔒 Segurança

- Autenticação via OAuth integrada
- Validação de dados com Zod
- Proteção de rotas com tRPC procedures
- Credenciais armazenadas como variáveis de ambiente

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs de execução no dashboard
2. Consulte a documentação da API Amadeus
3. Entre em contato com o suporte

---

**Desenvolvido com ❤️ usando Manus Platform**
