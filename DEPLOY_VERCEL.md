# Guia de Publicação na Vercel - MARIS MAKEUP

Este projeto já está 100% configurado para rodar na **Vercel** com:
- Frontend React (Vite) servido na CDN de alta velocidade.
- Backend API Express executado em Serverless Functions (`/api`).
- Banco de dados em nuvem permanente via **Supabase**.
- Roteamento SPA automático configurado no `vercel.json`.

---

## Passo a Passo para Publicar

### 1. Exportar o Projeto para o GitHub
1. No menu superior do Google AI Studio, clique em **Export** e selecione **GitHub** (ou exporte o arquivo `.zip` e faça upload no seu repositório GitHub).

---

### 2. Conectar e Publicar na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login (pode ser com sua conta do GitHub).
2. Clique no botão **Add New...** -> **Project**.
3. Localize o repositório `maris-makeup` e clique em **Import**.
4. As configurações de Build serão detectadas automaticamente:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

---

### 3. Configurar Variáveis de Ambiente na Vercel
Na seção **Environment Variables** durante a criação do projeto (ou em *Settings > Environment Variables* na Vercel), adicione:

| Variável | Descrição | Onde Obter |
| :--- | :--- | :--- |
| `SUPABASE_URL` | URL do seu projeto no Supabase (ex: `https://xxx.supabase.co`) | Supabase > Project Settings > API |
| `SUPABASE_ANON_KEY` | Chave pública anônima do Supabase | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço secreta para gravação de dados administrativos | Supabase > Project Settings > API |

> **Nota:** Se você ainda não configurou o Supabase, o sistema iniciará em modo de demonstração local na Vercel, mas recomendamos conectar o Supabase para que todas as vendas e produtos cadastrados nunca sejam perdidos.

---

### 4. Concluir o Deploy
1. Clique em **Deploy**.
2. Em menos de 1 minuto seu link estará ativo (ex: `https://maris-makeup.vercel.app`).
3. Para usar seu próprio domínio (ex: `loja.marismakeup.com.br`), acesse **Settings > Domains** no painel da Vercel.
