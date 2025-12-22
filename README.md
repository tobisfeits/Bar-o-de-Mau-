# 🎯 Desbravadores - Sistema de Pontuação

Sistema de pontuação para o Clube de Desbravadores Barão de Mauá.

## 🚀 Tecnologias

- **Frontend:** HTML, CSS (Tailwind), JavaScript
- **Backend:** Supabase (PostgreSQL)
- **Icons:** Lucide Icons
- **Deploy:** Vercel

## 📦 Estrutura

```
├── index.html              # Página principal
├── app.js                  # Lógica da aplicação
├── supabase_schema.sql     # Schema do banco de dados
├── vercel.json             # Configuração Vercel
└── fotos/                  # Fotos dos membros
```

## 🔧 Funcionalidades

- ✅ Sistema de login com PIN
- ✅ Gestão de unidades e membros
- ✅ Pontuação diária com toggles
- ✅ Avaliação de conselheiros
- ✅ Ranking de conselheiros
- ✅ Relatórios automáticos
- ✅ Proteção contra perda de dados
- ✅ Cache inteligente (5 min TTL)
- ✅ Modo offline com fallback

## 🌐 Deploy

### Vercel (Recomendado)

**📖 Veja o guia completo:** [DEPLOY.md](DEPLOY.md)

**Resumo rápido:**
1. Conecte seu repositório na Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático!

### Local

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env com suas credenciais do Supabase

# Servidor HTTP simples
python -m http.server 8000

# Ou
npx http-server -p 8000
```

Abrir `http://localhost:8000`

## 🔐 Configuração

### Variáveis de Ambiente

**Para desenvolvimento local:**
1. Copie `.env.example` para `.env`
2. Preencha com suas credenciais do Supabase

**Para Vercel:**
- Configure no dashboard: Settings → Environment Variables
- Veja [DEPLOY.md](DEPLOY.md) para instruções detalhadas

### Supabase

1. Criar projeto no Supabase
2. Executar `supabase_schema.sql`
3. Configurar RLS (Row Level Security)
4. Obter credenciais em Settings → API

### CORS

Adicionar domínio da Vercel no Supabase:
- Settings → API → CORS Allowed Origins

## 👥 Usuários Padrão

- Diane (PIN: dia2026)
- Silas (PIN: sil2026)
- Vânia (PIN: vân2026)
- Tobias (PIN: tob2026)

## 📝 Licença

MIT

## 👨‍💻 Desenvolvido para

Clube de Desbravadores Barão de Mauá
