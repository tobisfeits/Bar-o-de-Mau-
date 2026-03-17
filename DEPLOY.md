# 🚀 Guia de Deploy - Vercel

Este guia mostra como fazer deploy do Sistema de Pontuação Barão de Mauá na Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com) com projeto criado
- Repositório Git (GitHub, GitLab ou Bitbucket)

## 🔧 Configuração Local (Desenvolvimento)

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

> [!IMPORTANT]
> **Nunca commite o arquivo `.env`** no Git! Ele já está no `.gitignore`.

### 2. Testar Localmente

Inicie um servidor HTTP local:

```bash
# Opção 1: Python
python -m http.server 8000

# Opção 2: Node.js
npx http-server -p 8000

# Opção 3: PHP
php -S localhost:8000
```

Abra `http://localhost:8000` no navegador.

## 🌐 Deploy na Vercel

### Método 1: Via Dashboard (Recomendado)

#### Passo 1: Conectar Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Importe seu repositório Git
4. Clique em **"Import"**

#### Passo 2: Configurar Projeto

Na tela de configuração:

- **Framework Preset**: Other
- **Root Directory**: `./` (deixe em branco)
- **Build Command**: (deixe em branco)
- **Output Directory**: `./` (deixe em branco)

#### Passo 3: Configurar Variáveis de Ambiente

> [!WARNING]
> **Este passo é OBRIGATÓRIO!** Sem as variáveis de ambiente, o app funcionará apenas em modo offline.

1. Clique em **"Environment Variables"**
2. Adicione as seguintes variáveis:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sua-chave-anon-aqui` |

3. Selecione **Production**, **Preview** e **Development**
4. Clique em **"Add"** para cada variável

#### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (1-2 minutos)
3. Acesse o link gerado (ex: `https://seu-projeto.vercel.app`)

### Método 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy para produção
vercel --prod
```

## 🔐 Configuração do Supabase

### 1. Obter Credenciais

No dashboard do Supabase:

1. Acesse **Settings** → **API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 2. Configurar CORS

Adicione o domínio da Vercel nas origens permitidas:

1. Acesse **Settings** → **API** → **CORS Allowed Origins**
2. Adicione: `https://seu-projeto.vercel.app`
3. Clique em **"Save"**

### 3. Executar Schema SQL

Se ainda não executou, rode o arquivo `supabase_schema.sql`:

1. Acesse **SQL Editor** no Supabase
2. Cole o conteúdo de `supabase_schema.sql`
3. Clique em **"Run"**

## ✅ Verificação

Após o deploy, verifique:

- [ ] Site carrega sem erros
- [ ] Console mostra: `✅ Supabase conectado!`
- [ ] Login funciona
- [ ] Dados são salvos no Supabase
- [ ] Modo offline funciona (desconecte internet)

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não encontradas"

**Solução**: Verifique se as variáveis foram configuradas corretamente na Vercel:
1. Acesse **Settings** → **Environment Variables**
2. Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existem
3. Faça um novo deploy: `vercel --prod`

### Erro: "Failed to fetch" ou CORS

**Solução**: Configure CORS no Supabase:
1. Adicione o domínio Vercel nas origens permitidas
2. Aguarde 1-2 minutos para propagar

### App funciona local mas não na Vercel

**Solução**: 
1. Verifique se o arquivo `config.js` foi commitado
2. Confirme que `index.html` carrega `config.js` antes de `app.js`
3. Verifique logs no dashboard da Vercel

### Modo offline sempre ativo

**Solução**: Verifique se as variáveis de ambiente estão corretas:
```javascript
// Abra o console do navegador e digite:
console.log(ENV_CONFIG);
// Deve mostrar URL e KEY preenchidos
```

## 🔄 Atualizações

Para atualizar o app após mudanças:

```bash
# Commit suas mudanças
git add .
git commit -m "Descrição da mudança"
git push

# Vercel fará deploy automático!
```

## 📱 Domínio Customizado

Para usar um domínio próprio:

1. Acesse **Settings** → **Domains** na Vercel
2. Clique em **"Add"**
3. Digite seu domínio
4. Siga as instruções de configuração DNS

## 🎯 Próximos Passos

- [ ] Configurar domínio customizado
- [ ] Adicionar analytics (Vercel Analytics)
- [ ] Configurar notificações de deploy
- [ ] Testar em diferentes dispositivos

## 📞 Suporte

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Variáveis de Ambiente](https://vercel.com/docs/environment-variables)
