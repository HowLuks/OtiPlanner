# Manual do Usuário - OtiPlanner

Bem-vindo ao OtiPlanner! Este manual descreve as funcionalidades de cada tela do sistema para ajudá-lo a gerenciar seu negócio de forma eficiente.

---

## 1. Tela de Login

Esta é a porta de entrada para o sistema.

- **Entrar:** Permite que usuários já cadastrados acessem o sistema com seu e-mail e senha.
- **Criar Conta:** Permite que um novo usuário crie uma conta fornecendo um e-mail e senha. Após a criação, o usuário é automaticamente logado e redirecionado para o Dashboard.
- **Notificações (Toasts):** Mensagens aparecem no canto da tela para informar sobre sucesso ou falhas na autenticação (ex: "E-mail ou senha incorretos.").

---

## 2. Tela Principal (Agendamentos)

Esta é a tela central para a gestão diária dos seus agendamentos.

- **Calendário:**
  - Permite visualizar os dias do mês.
  - Ao clicar em um dia, a lista de "Agendamentos Confirmados" abaixo é atualizada para mostrar apenas os compromissos daquela data.

- **Botão "Novo Agendamento":**
  - Abre um popup para cadastrar um novo compromisso.
  - **Campos do Popup:**
    - `Cliente`: Nome do cliente.
    - `WhatsApp`: Número do cliente (opcional).
    - `Data` e `Horário`: Data e hora do agendamento.
    - `Serviço`: Lista de serviços disponíveis para seleção.
    - `Status` (se a seleção manual estiver ativa): Permite escolher se o agendamento será `Pendente` ou `Confirmado`.
    - `Profissional` (se o status for "Confirmado"): Lista de profissionais qualificados para o serviço selecionado. Se a seleção for automática, este campo aparecerá desabilitado com o texto "Atribuído automaticamente".
  - **Botão "Salvar Agendamento":** Cria o agendamento. Se houver algum conflito de horário, uma mensagem de erro será exibida no popup.

- **Agendamentos Confirmados:**
  - Lista todos os agendamentos confirmados para o dia selecionado no calendário.
  - Cada linha exibe o horário, cliente, serviço e o profissional responsável (com sua foto).
  - **Ações:**
    - `Ícone de Lixeira`: Permite deletar um agendamento confirmado. Uma janela de confirmação aparecerá para evitar exclusões acidentais. A exclusão também remove a transação financeira associada.

- **Agendamentos Pendentes (Coluna à Direita):**
  - Lista todos os agendamentos que ainda não foram atribuídos a um profissional.
  - **Ações por Agendamento:**
    - `Ícone de Check (✔)`: Abre um popup para confirmar o agendamento. Nele, você deve selecionar um profissional da lista de qualificados. O sistema avisará se houver conflito de horário.
    - `Ícone de X`: Rejeita e remove o agendamento da lista de pendentes.

---

## 3. Dashboard

Oferece uma visão geral e rápida da saúde financeira e do desempenho da sua equipe.

- **Cards de Resumo:**
  - `Saldo em Caixa`: Mostra o balanço total (Entradas - Saídas) de todas as transações.
  - `Meta Total de Vendas`: Exibe a porcentagem da meta de vendas geral atingida por toda a equipe, com uma barra de progresso.
  - `Total de Funcionários`: Conta quantos funcionários estão cadastrados.

- **Progresso Individual dos Funcionários:**
  - Para cada funcionário, um card exibe:
    - Um gráfico de rosca (donut chart) mostrando a porcentagem da meta de vendas atingida.
    - Foto, nome e função do funcionário.
    - O valor vendido em relação à meta estipulada (ex: R$ 1.500 / R$ 2.000).

---

## 4. Clientes

Gerencia sua base de clientes e facilita a comunicação.

- **Lista de Clientes:**
  - Cada cliente é exibido em um card com seu nome, status (`Ativo` ou `Inativo`), telefone e data da última visita.
  - Um cliente é considerado `Ativo` se sua última visita foi há menos de 60 dias.
  - **Limpeza Automática:** Clientes inativos por mais de 1 ano são automaticamente deletados ao carregar esta página.

- **Botão "Novo Cliente":**
  - Abre um popup para adicionar um novo cliente com `Nome` and `WhatsApp`.

- **Botão "Fazer Disparos":**
  - Abre um popup para enviar mensagens em massa via WhatsApp.
  - **Funcionalidades do Popup:**
    - `Selecione o público`: Filtra os destinatários por `Todos`, `Ativos` ou `Inativos`.
    - `Mensagem`: Campo para escrever a mensagem a ser enviada.
    - `Botão "Gerar Links de Disparo"`: Cria uma lista de links. Cada link, ao ser clicado, abre o WhatsApp com a conversa do cliente já preenchida com a mensagem que você escreveu, pronto para ser enviada.

- **Ações por Cliente:**
  - `Ícone de Lixeira`: Deleta o cadastro do cliente (os agendamentos e transações antigas são mantidos para preservar o histórico).
  - `Botão "Ver Histórico"`: Abre um popup que lista todos os agendamentos passados daquele cliente, mostrando data, serviço e horário.

---

## 5. Funcionários

Tela para gerenciar sua equipe, suas metas, funções e horários.

- **Lista de Funcionários:**
  - Cada funcionário é exibido em um card com sua foto, nome, função e progresso da meta de vendas.

- **Botão "Novo Funcionário":**
  - Abre um popup para cadastrar um novo membro da equipe, definindo `Foto`, `Nome`, `Função` e `Meta de Vendas`.

- **Botão "Gerenciar Funções":**
  - Abre um popup para criar, editar ou deletar as funções (cargos) da empresa (ex: "Cabeleireiro", "Manicure"). Funções em uso não podem ser deletadas.

- **Ações por Funcionário:**
  - `Ícone de Editar`: Abre um popup com duas abas:
    - `Alterar Meta`: Permite ajustar a meta de vendas do funcionário.
    - `Editar Funcionário`: Permite alterar a foto, nome e função.
  - `Ícone de Bloqueio (Ban)`: Abre um popup para cadastrar um período de bloqueio na agenda do funcionário (ex: folga, consulta médica). Você seleciona o dia e o intervalo de horas (início e fim).
  - `Ícone de Lixeira`: Deleta o funcionário do sistema.

---

## 6. Serviços

Gerencia os serviços oferecidos pelo seu estabelecimento.

- **Lista de Serviços:**
  - Uma tabela exibe todos os serviços com seu `Nome`, `Função` (quem pode executá-lo), `Duração` e `Valor`.

- **Botão "Novo Serviço":**
  - Abre um popup para adicionar um novo serviço, definindo `Nome`, `Valor`, `Duração` (em minutos) e a `Função` necessária para realizá-lo.

- **Ações por Serviço:**
  - `Ícone de Lixeira`: Deleta o serviço. **Atenção:** Esta ação também deletará todos os agendamentos (confirmados e pendentes) associados a este serviço.

---

## 7. Financeiro

Controla todas as movimentações financeiras.

- **Resumo:**
  - Cards exibem o valor total de `Entradas` e `Saídas`.

- **Botão "Nova Transação":**
  - Abre um popup para registrar uma nova movimentação financeira manual (que não seja de um agendamento), como compra de material ou pagamento de contas.
  - Campos: `Data`, `Descrição`, `Valor` e `Tipo` (`Entrada` ou `Saída`).

- **Tabela de Transações Recentes:**
  - Lista todas as transações, incluindo as geradas automaticamente por agendamentos e as manuais.
  - Exibe data, descrição, tipo e valor.
  - **Ações:**
    - `Ícone de Editar`: Permite editar uma transação manual. Transações de agendamentos não podem ser editadas diretamente.
    - `Ícone de Lixeira`: Permite deletar uma transação manual. Transações de agendamentos não podem ser deletadas por aqui (apenas ao deletar o agendamento correspondente).

---

## 8. Configurações

Define as regras e comportamentos gerais do sistema.

- **Definir Horários de Trabalho:**
  - Selecione um funcionário para definir seu horário de trabalho para cada dia da semana (`início` e `fim`). Deixe os campos em branco para dias de folga.

- **Seleção Manual de Funcionários:**
  - `Switch (botão de ligar/desligar)`: Quando **ativado**, todos os novos agendamentos criados pela tela principal cairão como "Pendentes", exigindo que você atribua um profissional manualmente. Quando **desativado**, o sistema tenta atribuir o profissional automaticamente.

- **Webhook de Lembrete de Agendamento:**
  - `URL do Webhook`: Campo para inserir a URL que receberá os dados dos agendamentos do dia seguinte.
  - `Botão Salvar`: Salva a URL no banco de dados.
  - **Importante:** Para que os lembretes sejam enviados, você precisa configurar um serviço externo (como o `cron-job.org`) para chamar a API `/api/appointments/trigger-reminders` uma vez por dia.
