# 📊 Como Popular o Banco de Dados no Supabase

## 🎯 Objetivo
Adicionar as **6 unidades** e **57 desbravadores** no banco de dados Supabase.

---

## 📝 Passo a Passo

### 1️⃣ Acessar o Supabase
1. Acesse: https://supabase.com
2. Faça login na sua conta
3. Selecione o projeto do **Barão de Mauá**

### 2️⃣ Abrir o SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor** (ícone de código `</>`)
2. Clique em **New Query** (ou **+ New query**)

### 3️⃣ Executar o Script
1. Abra o arquivo [`populate_data.sql`](file:///c:/Users/tobias.matos/.gemini/antigravity/playground/spatial-interstellar/populate_data.sql)
2. **Copie todo o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### 4️⃣ Verificar os Resultados
Após executar, você verá uma tabela mostrando:
```
┌─────────────────────────────┬───────┐
│ tabela                      │ total │
├─────────────────────────────┼───────┤
│ Usuários inseridos:         │ 4     │
│ Unidades inseridas:         │ 6     │
│ Desbravadores inseridos:    │ 57    │
│ Conselheiros inseridos:     │ 11    │
└─────────────────────────────┴───────┘
```

---

## ✅ Dados que Serão Inseridos

### 👥 Usuários (4)
- Diane (PIN: dia2026)
- Silas (PIN: sil2026)
- Vânia (PIN: vân2026)
- Tobias (PIN: tob2026)

### 🏆 Unidades (6)
1. **Barões** - 8 membros (2 conselheiros)
2. **Baronesa** - 10 membros (3 conselheiras)
3. **Duquesas** - 11 membros (2 conselheiras)
4. **Imperadores** - 9 membros (2 conselheiros)
5. **Imperatrizes** - 8 membros (2 conselheiras)
6. **Lokomotiva** - 11 membros (0 conselheiros)

### 👨‍🏫 Total de Conselheiros: 11

---

## 🔍 Como Verificar se Funcionou

### Opção 1: Via SQL Editor
Execute esta query:
```sql
SELECT 
    u.name as unidade,
    COUNT(m.id) as total_membros,
    COUNT(CASE WHEN m.is_counselor THEN 1 END) as conselheiros
FROM units u
LEFT JOIN members m ON u.id = m.unit_id
GROUP BY u.id, u.name
ORDER BY u.name;
```

### Opção 2: Via Table Editor
1. Clique em **Table Editor** no menu lateral
2. Selecione a tabela **units** → Deve mostrar 6 unidades
3. Selecione a tabela **members** → Deve mostrar 57 desbravadores
4. Selecione a tabela **app_users** → Deve mostrar 4 usuários

---

## 🚀 Após Popular os Dados

1. **Recarregue o app** no celular: https://barao-maua-pontuacao.vercel.app
2. Faça login com um dos usuários (ex: Tobias / tob2026)
3. Clique em **"Adicionar Unidade"** → Agora deve aparecer a lista de 6 unidades!
4. Selecione uma unidade para ver os desbravadores

---

## ⚠️ Importante

- O script usa `ON CONFLICT DO NOTHING`, então é **seguro executar múltiplas vezes**
- Se você já tiver alguns dados, eles **não serão duplicados**
- Se precisar **resetar tudo**, execute antes:
  ```sql
  DELETE FROM scores;
  DELETE FROM counselor_scores;
  DELETE FROM members;
  DELETE FROM units;
  DELETE FROM app_users;
  ```

---

## 🆘 Problemas Comuns

### "Erro: violates foreign key constraint"
- Execute o script de reset acima primeiro
- Depois execute o `populate_data.sql` novamente

### "Erro: duplicate key value"
- Isso é normal se você já executou o script antes
- Os dados já estão no banco, pode ignorar

### Não aparece nada no app
- Verifique se as variáveis de ambiente estão corretas na Vercel
- Limpe o cache do navegador/app
- Verifique o console do navegador (F12) para erros
