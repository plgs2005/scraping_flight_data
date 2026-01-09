# Flight Deals Tracker - TODO

## Banco de Dados
- [x] Criar tabela de regras de monitoramento (monitoring_rules)
- [x] Criar tabela de histórico de ofertas (deals_history)
- [x] Configurar relacionamentos entre tabelas

## Backend - CRUD de Regras
- [x] Criar endpoint para listar regras
- [x] Criar endpoint para adicionar nova regra
- [x] Criar endpoint para editar regra existente
- [x] Criar endpoint para deletar regra
- [x] Criar endpoint para buscar regra por ID

## Backend - Integração com APIs
- [x] Integrar Amadeus API para busca de voos
- [ ] Integrar API para busca de cruzeiros
- [x] Implementar validação de ofertas (verificar disponibilidade)
- [x] Implementar cálculo de percentual de desconto
- [x] Criar cache de resultados para evitar requisições duplicadas

## Backend - Sistema de Notificações
- [x] Implementar envio de email com ofertas
- [x] Implementar envio para webhook customizado
- [x] Criar template de email com ofertas formatadas
- [x] Validar configurações de notificação por regra

## Backend - Job Agendado
- [x] Criar job diário para executar buscas
- [x] Implementar lógica de busca baseada nas regras ativas
- [x] Implementar envio automático de notificações
- [x] Adicionar logs de execução do job

## Frontend - Dashboard
- [x] Criar layout do dashboard com sidebar
- [x] Implementar página inicial com resumo de regras ativas
- [x] Criar formulário para adicionar nova regra
- [x] Criar formulário para editar regra existente
- [x] Implementar listagem de regras com ações (editar/deletar)
- [x] Adicionar confirmação antes de deletar regra

## Frontend - Visualização de Ofertas
- [x] Criar página de histórico de ofertas
- [x] Implementar cards de ofertas com informações detalhadas
- [ ] Adicionar filtros por destino, data e desconto
- [ ] Implementar paginação de resultados
- [x] Adicionar link direto para oferta oficial

## Testes e Validação
- [x] Criar testes unitários para CRUD de regras
- [x] Criar testes para integração com APIs
- [ ] Criar testes para sistema de notificações
- [x] Testar job agendado manualmente
- [x] Validar fluxo completo end-to-end

## Documentação
- [ ] Documentar estrutura do banco de dados
- [ ] Documentar endpoints da API
- [ ] Criar guia de uso do sistema
- [ ] Documentar configuração de APIs externas

## Novos Recursos - Filtros
- [x] Adicionar filtro por companhia aérea na página de ofertas
- [x] Adicionar filtro por faixa de preço na página de ofertas
- [x] Implementar lógica de filtragem no frontend
- [x] Adicionar botão para limpar filtros

## Filtros de Rotas
- [x] Adicionar filtro por origem (dropdown com códigos IATA)
- [x] Adicionar filtro por destino (dropdown com códigos IATA)
- [x] Implementar lógica de filtragem por rotas
- [x] Atualizar contador de ofertas filtradas

## Filtros de Data e Desconto
- [x] Adicionar filtro por data de ida (período)
- [x] Adicionar filtro por data de volta (período)
- [x] Adicionar filtro por percentual de desconto mínimo
- [x] Implementar lógica de filtragem por datas
- [x] Implementar lógica de filtragem por desconto

## Sistema de Ordenação
- [x] Adicionar dropdown de ordenação na página de ofertas
- [x] Implementar ordenação por maior desconto
- [x] Implementar ordenação por menor preço
- [x] Implementar ordenação por data mais próxima
- [x] Implementar ordenação por mais recente (data de descoberta)

## Sistema de Alertas Push
- [x] Criar tabela de alertas no banco de dados
- [x] Implementar CRUD de alertas no backend
- [x] Criar página de gerenciamento de alertas
- [x] Implementar solicitação de permissão de notificações
- [x] Integrar Web Push API para notificações no navegador
- [x] Modificar job agendado para verificar alertas e enviar notificações
- [x] Adicionar badge de contador de alertas ativos no dashboard
