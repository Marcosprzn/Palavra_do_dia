# 📖 Palavra do Dia - Disparador Automático WhatsApp

Aplicação web completa para envio automatizado e diário de versículos bíblicos com imagens e mensagens personalizadas para seus contatos e grupos do WhatsApp.

Desenvolvido com **Node.js**, **Express**, **Socket.IO**, **@whiskeysockets/baileys**, **React 18**, **Vite** e **Tailwind CSS**.

---

## ✨ Funcionalidades Principais

1. **Conexão Direta com WhatsApp (Baileys)**:
   - Pareamento instantâneo via QR Code em tempo real no painel web.
   - Gerenciamento de sessão persistente (`useMultiFileAuthState`) para manter a conexão ativa.
   - Sincronização automática de contatos e grupos.

2. **Versículo do Dia Automático + Seleção Manual**:
   - Base curada de centenas de versículos bíblicos em português (Salmos, Provérbios, Evangelhos, Epístolas).
   - Geração automática do versículo do dia.
   - Botão **"Sortear Outro"** com 1 clique.
   - Modal de busca para pesquisar qualquer versículo por tema, livro ou palavra-chave.
   - Campo para adicionar saudação/mensagem personalizada acima do versículo.

3. **Anexo de Imagem Manual**:
   - Upload de imagens (JPG, PNG, WEBP) do computador ou celular.
   - Envio da imagem para todos os contatos com o versículo como legenda (*caption*).
   - Remoção ou troca de imagem com 1 clique.

4. **Pré-visualização ao Vivo (Live Preview)**:
   - Simulação idêntica ao balão do WhatsApp no celular para ver exatamente como a mensagem chegará aos destinatários antes de enviar.

5. **Agendamento Inteligente com Proteção Anti-Ban**:
   - Horário padrão configurado para **06:00 AM** (alterável em tempo real pelo painel).
   - Botão **"Disparar Agora"** para testes ou envios manuais imediatos.
   - Fila segura com intervalos humanizados aleatórios (3 a 7 segundos entre cada contato) para evitar bloqueios do WhatsApp.
   - Histórico e logs de status de entrega com barra de progresso em tempo real.

6. **Camada de Banco Híbrida**:
   - **Local**: SQLite automático sem nenhuma configuração necessária.
   - **Nuvem / Supabase**: Suporte nativo a PostgreSQL através da variável `DATABASE_URL`.

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js versão 18 ou superior instalado.

### 2. Instalação das dependências
Na raiz do projeto:
```bash
npm install
npm --prefix client install
```

### 3. Rodar a aplicação
Para compilar o frontend e iniciar o servidor unificado:
```bash
npm run build
npm start
```
Ou para desenvolvimento com hot-reload no frontend:
```bash
# Terminal 1 (Backend):
npm run dev

# Terminal 2 (Frontend):
npm --prefix client run dev
```

Abra seu navegador em: **`http://localhost:3000`** (ou `http://localhost:5173` no modo dev).

---

## ☁️ Como Hospedar no Render.com com Supabase

### 1. Banco de Dados no Supabase
1. Crie um projeto gratuito no [supabase.com](https://supabase.com).
2. Vá em **Project Settings** > **Database** > **Connection string** (modo URI / Transaction Pooler ou Direct).
3. Copie a URL de conexão (exemplo):
   ```text
   postgresql://postgres.seu_usuario:sua_senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

### 2. Web Service no Render.com
1. No painel do [render.com](https://render.com), crie um novo **Web Service**.
2. Conecte seu repositório Git.
3. Preencha as configurações:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Na seção **Environment Variables** (Variáveis de Ambiente), adicione:
   - `DATABASE_URL`: *(Cole a URL do Supabase obtida no passo 1)*
   - `SESSION_DATA_PATH`: `./sessions`
   - `DEFAULT_SCHEDULE_TIME`: `06:00`
   - `NODE_VERSION`: `22`
5. *(Opcional, mas altamente recomendado no Render Starter)*: Adicione um **Persistent Disk** montado em `/opt/render/project/src/sessions` (1GB) para que a sessão do WhatsApp continue salva mesmo que o servidor reinicie.

---

## 🧪 Testes Automatizados

Para rodar toda a suíte de testes (Banco, Versículos, WhatsApp, Agendador e API REST):
```bash
npm test
```
