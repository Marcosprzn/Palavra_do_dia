# Especificação de Design: Palavra do Dia - Disparador WhatsApp

- **Data**: 2026-10-11
- **Status**: Aprovado pelo Usuário
- **Autor**: Antigravity & Usuário

---

## 1. Visão Geral do Produto

O **Palavra do Dia** é uma aplicação web completa desenvolvida para permitir que um usuário envie automaticamente ou manualmente o "Versículo do Dia" para seus contatos e grupos do WhatsApp. A aplicação se conecta ao WhatsApp através da biblioteca `@whiskeysockets/baileys`, gera ou seleciona versículos bíblicos de uma base curada local em português, permite o anexo manual de imagens e realiza disparos programados em horário configurável (padrão 06:00 AM).

---

## 2. Requisitos Funcionais

1. **Conexão WhatsApp (Baileys)**:
   - Exibição de QR Code em tempo real no frontend via WebSocket (Socket.IO).
   - Gerenciamento de sessão persistente (`useMultiFileAuthState`) para evitar reconexões manuais frequentes.
   - Detecção de status: Conectando, Conectado (com número e nome do usuário), Desconectado, e botão para Desconectar/Resetar sessão.
   - Sincronização e listagem de contatos e grupos com busca e seleção.

2. **Gerenciador de Versículos do Dia**:
   - Base curada local com centenas de versículos em português (Almeida Revista e Atualizada / NVI) armazenada localmente em JSON/SQLite.
   - Seleção automática diária de versículo sem repetições recentes.
   - Opção para gerar outro versículo aleatório com 1 clique ("Sortear outro").
   - Opção para pesquisar e selecionar manualmente qualquer versículo do acervo bíblico.
   - Campo para edição personalizada do texto antes do envio (adicionar saudação, assinatura, reflexão).

3. **Anexo de Imagem**:
   - Upload de imagem manual do computador/celular (JPEG, PNG, WEBP).
   - Pré-visualização da imagem anexada na interface.
   - Envio da imagem para os contatos com o versículo configurado como legenda (*caption*), ou envio apenas de texto caso nenhuma imagem seja anexada.
   - Botão para remover ou trocar a imagem anexada a qualquer momento.

4. **Agendamento & Envio**:
   - Horário padrão de disparo: 06:00 AM todos os dias.
   - Interface para alterar facilmente o horário do agendamento diário (persistido em banco SQLite).
   - Agendamento motorizado por `node-cron`.
   - Botão "Disparar Agora" para envios manuais imediatos ou testes.
   - Mecanismo seguro de fila de disparo com intervalos humanizados aleatórios (ex: 3 a 7 segundos) entre cada contato para proteção anti-bloqueio.
   - Histórico e log de envios com status (sucesso/falha) por contato.

5. **Gerenciamento de Destinatários**:
   - Lista sincronizada de contatos e grupos do WhatsApp.
   - Checkboxes para selecionar destinatários que receberão as mensagens ("Enviar para todos", "Selecionar contatos", "Selecionar grupos").
   - Persistência dos destinatários marcados no banco de dados SQLite local.

---

## 3. Arquitetura Técnica

### 3.1. Stack Tecnológica
- **Backend**:
  - Runtime: Node.js (v18+)
  - Servidor HTTP & API: Express.js
  - Comunicação em Tempo Real: Socket.IO (emissão de QR Code, progresso de envio e status de conexão)
  - Integração WhatsApp: `@whiskeysockets/baileys`
  - Agendador de Tarefas: `node-cron`
  - Banco de Dados: `better-sqlite3` (armazenamento leve de configurações, histórico e seleção de destinatários)
  - Manipulação de Uploads: `multer`
- **Frontend**:
  - Framework: React 18 / 19 com Vite
  - Estilização: Tailwind CSS (tema Dark/Moderno, paleta premium)
  - Ícones: `lucide-react`
  - Comunicação: Socket.IO Client + Fetch API / Axios

### 3.2. Estrutura de Diretórios Proposta
```text
palavra-do-dia/
├── server/
│   ├── config/             # Configurações globais e banco de dados SQLite
│   ├── data/
│   │   └── verses.json     # Base de dados curada com versículos em PT-BR
│   ├── services/
│   │   ├── whatsapp.js     # Motor Baileys (sessão, QR code, envio de mensagens)
│   │   ├── scheduler.js    # Motor node-cron para agendamento diário
│   │   └── verseService.js # Lógica de seleção diária, sorteio e busca de versículos
│   ├── routes/             # Endpoints REST (settings, contacts, upload, verses, send)
│   └── index.js            # Servidor Express + Socket.IO
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WhatsAppStatus.jsx # Card de status e QR Code
│   │   │   ├── VerseCard.jsx      # Visualizador, sorteador e editor do versículo
│   │   │   ├── ImageAttachment.jsx# Área de upload e prévia da imagem
│   │   │   ├── SchedulePicker.jsx # Seletor de horário e contador
│   │   │   ├── ContactList.jsx    # Seletor de contatos/grupos com busca
│   │   │   └── SendLogs.jsx       # Log de envios em tempo real
│   │   ├── App.jsx
│   │   └── index.css
│   └── index.html
├── uploads/                # Armazenamento temporário de imagens anexadas
├── sessions/               # Sessão persistente Baileys (auth_info_baileys)
├── package.json
└── README.md
```

---

## 4. Fluxo de Dados e Ciclo de Vida do Envio

1. **Inicialização**:
   - Backend inicializa SQLite e carrega configurações (horário de disparo, destinatários ativos, versículo do dia atual).
   - Baileys inicia a verificação da pasta `sessions/`. Se não houver credenciais válidas, gera QR Code e emite via Socket.IO para o frontend.
   - Agendador `node-cron` registra o cronjob para o horário configurado (ex: `0 6 * * *`).

2. **Geração do Versículo**:
   - Se for um novo dia ou sob comando do usuário, o `verseService` seleciona um versículo aleatório não utilizado recentemente.
   - O versículo fica armazenado como o "versículo ativo do dia".
   - O usuário pode editar o texto, sortear outro ou escolher um específico.

3. **Disparo Agendado / Manual**:
   - O disparador recupera o versículo ativo, a imagem anexada (se houver) e os destinatários marcados como ativos.
   - Para cada contato/grupo:
     - Envia a mensagem (se houver imagem: envia mensagem de imagem com legenda; senão, envia texto puro).
     - Emite evento Socket.IO de progresso (ex: "Enviado 3 de 45").
     - Aguarda delay humanizado (3-7s) antes do próximo envio.
   - Salva o resultado no histórico de envios do SQLite.

---

## 5. UI/UX e Princípios Visuais

- **Layout Dashboard Moderno**: Design elegante em tema escuro (`slate-900 / zinc-900`) com destaques em azul/esmeralda sutil.
- **Visualizador em Tempo Real (WhatsApp Live Preview)**: Um balão de pré-visualização que mostra exatamente como a mensagem (imagem + texto) chegará no celular do destinatário.
- **Feedback Interativo**: Indicadores visuais claros de conexão (verde para conectado, amarelo para QR Code pendente, vermelho para erro), alertas sonoros/visuais ao completar envios.
- **Acessibilidade e Usabilidade**: Ações principais com apenas um clique (botão "Enviar Agora", botão "Sortear Outro Versículo").
