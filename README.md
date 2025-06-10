# Lista de Compras Compartilhada 🛒🔒

Um sistema moderno e seguro para gerenciar listas de compras compartilhadas em tempo real, agora com autenticação de usuários!

## 🚀 Novas Funcionalidades de Autenticação

### 🔐 Sistema de Autenticação Segura

- Páginas de **login e cadastro** com validação de formulários
- **Hook useAuth** para gerenciamento centralizado do estado de autenticação
- **Proteção de rotas** - acesso restrito a usuários autenticados
- **Menu do usuário** com opção de logout no header

### 💾 Integração com Banco de Dados

- Conexão com **Supabase** para armazenamento seguro
- Sincronização automática das listas com o banco de dados
- Dados persistentes entre sessões

### 🛠 Como Testar

1. Acesse `/auth` para registrar ou fazer login
2. Após autenticação, você será redirecionado automaticamente
3. Todas as alterações agora são salvas no banco de dados

> **Dica para desenvolvimento:** Desative a confirmação de email nas configurações do Supabase para agilizar os testes

## 📌 Próximas Atualizações (Roadmap Atualizado)

- [x] **Sistema completo de autenticação**
- [ ] Funcionalidade de compartilhamento (convidar colaboradores)
- [ ] Notificações em tempo real
- [ ] Edição de perfil do usuário
- [ ] Recuperação de senha
- [ ] Login com redes sociais

## 🛠 Tecnologias Utilizadas (Atualizado)

- **React.js** (Frontend)
- **Supabase** (Autenticação + Banco de dados)
- **React Hook Form + Yup** (Validação de formulários)
- **React Router** (Proteção de rotas)
- **Tailwind CSS** (Estilização)
- **Lucide React** (Ícones)

## 🚨 Proteção de Rotas

Rotas protegidas implementadas:

```javascript
<Route
  path="/app"
  element={
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  }
>
  {/* Rotas da aplicação */}
</Route>
```

## 📦 Estrutura do Projeto (Atualizada)

```
/src
  /auth
    Login.jsx
    Register.jsx
  /components
    ProtectedRoute.jsx
  /context
    AuthContext.jsx
  /hooks
    useAuth.js
```

## 🔄 Fluxo de Autenticação

1. Usuário acessa `/auth`
2. Faz login ou se registra
3. Supabase valida credenciais
4. useAuth atualiza o estado global
5. Usuário é redirecionado para `/app`
6. Dados são carregados do Supabase

## 🤝 Como Contribuir

1. Configure o arquivo `.env` com suas credenciais do Supabase
2. Instale as dependências com `npm install`
3. Rode `npm run dev` para iniciar
4. Faça suas alterações e abra um PR!

```bash
# Variáveis de ambiente necessárias
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_KEY=your-key
```

## 📄 Licença

MIT License - Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
