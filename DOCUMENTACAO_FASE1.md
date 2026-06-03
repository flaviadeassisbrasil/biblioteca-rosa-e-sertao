# Documentação Técnica — Fase 1 (MVP)
### Biblioteca e Museu Comunitário Seu Duchim
**Instituto Rosa e Sertão · Chapada Gaúcha - MG**

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack de Tecnologias](#2-stack-de-tecnologias)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Modelos de Dados (Firestore)](#5-modelos-de-dados-firestore)
6. [Camada de Serviços](#6-camada-de-serviços)
7. [Hooks React](#7-hooks-react)
8. [Contextos](#8-contextos)
9. [Componentes de Layout](#9-componentes-de-layout)
10. [Páginas](#10-páginas)
11. [Fluxos Principais](#11-fluxos-principais)
12. [Regras de Negócio](#12-regras-de-negócio)
13. [Script de Importação do Acervo](#13-script-de-importação-do-acervo)
14. [Variáveis de Ambiente](#14-variáveis-de-ambiente)

---

## 1. Visão Geral

O app da Biblioteca Seu Duchim substitui o controle manual de empréstimos da biblioteca. É um **Progressive Web App (PWA)** construído com React + Firebase que permite:

- Usuários fazerem login com conta Google e solicitarem empréstimos de livros
- Administradoras gerenciarem o acervo (cadastrar, editar, remover livros)
- Administradoras aprovarem, rejeitarem e registrarem devoluções de empréstimos
- Administradoras gerenciarem usuários (papéis e bloqueios)
- O sistema marcar automaticamente empréstimos em atraso

O app roda inteiramente no **Firebase Free Tier (Spark)**, sem custo algum para o instituto.

---

## 2. Stack de Tecnologias

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| UI | **React 18** + **TypeScript** | Componentes reativos com tipagem segura |
| Build | **Vite** | Bundler rápido, hot-reload instantâneo |
| Estilização | **TailwindCSS 3** | Utilitários CSS sem CSS custom; paleta de cores do cerrado |
| Roteamento | **React Router DOM 7** | SPA com rotas protegidas |
| Ícones | **Lucide React** | Ícones leves e consistentes |
| Auth | **Firebase Authentication** | Login com Google, zero backend próprio |
| Banco de dados | **Firebase Firestore** | NoSQL em tempo real, free tier generoso |
| Storage | **Firebase Storage** | Reservado para capas de livros (Fase 2) |
| Hosting | **Firebase Hosting** (futuro) | Opcional; hoje roda local/dev |

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER / APP                        │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌─────────┐  │
│  │  Pages   │   │Components│   │  Hooks   │  │ Context │  │
│  │          │◄──│          │◄──│          │◄─│  Auth   │  │
│  │ Login    │   │ Header   │   │ useAuth  │  │         │  │
│  │ Home     │   │ Layout   │   │ useBooks │  └────┬────┘  │
│  │ Catalog  │   │ BookCard │   └────┬─────┘       │       │
│  │ MyLoans  │   │ProtRoute │        │              │       │
│  │ admin/*  │   └──────────┘        │              │       │
│  └────┬─────┘                       │              │       │
│       │                             │              │       │
│       └──────────────┬──────────────┘              │       │
│                      ▼                             │       │
│            ┌─────────────────┐                     │       │
│            │    Services     │◄────────────────────┘       │
│            │                 │                             │
│            │ firebase.ts     │  (inicialização SDK)        │
│            │ auth.ts         │  (login / sync usuário)     │
│            │ books.ts        │  (CRUD livros)              │
│            │ loans.ts        │  (empréstimos + overdue)    │
│            │ users.ts        │  (gestão de usuários)       │
│            └────────┬────────┘                             │
└─────────────────────│───────────────────────────────────────┘
                      │  Firebase SDK (HTTPS)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      FIREBASE (Google)                      │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│   │    Auth     │  │  Firestore  │  │     Storage     │   │
│   │  (Google)   │  │  /books     │  │  (capas Fase 2) │   │
│   │             │  │  /loans     │  │                 │   │
│   │             │  │  /users     │  │                 │   │
│   └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Princípios arquiteturais

**Separação de responsabilidades em 4 camadas:**

```
Pages → Hooks/Context → Services → Firebase
```

- **Pages**: só renderizam UI e chamam hooks/contexto. Não acessam Firebase diretamente.
- **Hooks**: encapsulam estado React (`useState`, `useEffect`). Chamam Services.
- **Services**: funções puras async que falam com o Firebase. Sem estado React.
- **Firebase**: SDK inicializado uma única vez em `firebase.ts`.

**Por que essa divisão?**
Se um dia mudarmos o banco (ex: trocar Firestore por outro), só os Services precisam mudar. As Pages e Hooks continuam iguais.

---

## 4. Estrutura de Pastas

```
biblioteca-app/
├── src/
│   ├── components/
│   │   ├── books/
│   │   │   └── BookCard.tsx        # Card do livro com botão de solicitar
│   │   └── layout/
│   │       ├── Header.tsx          # Barra de navegação superior
│   │       ├── Layout.tsx          # Wrapper de página (header + main)
│   │       └── ProtectedRoute.tsx  # Guarda de rota autenticada/admin
│   ├── contexts/
│   │   └── AuthContext.tsx         # Contexto global de autenticação
│   ├── hooks/
│   │   ├── useAuth.ts              # Lógica de auth com Firebase
│   │   └── useBooks.ts             # Busca e filtro de livros
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── BooksManager.tsx    # CRUD de livros (admin)
│   │   │   ├── LoansManager.tsx    # Gestão de empréstimos (admin)
│   │   │   └── UsersManager.tsx    # Gestão de usuários (admin)
│   │   ├── Catalog.tsx             # Catálogo público com busca
│   │   ├── Home.tsx                # Tela inicial com atalhos
│   │   ├── Login.tsx               # Tela de login Google
│   │   └── MyLoans.tsx             # Empréstimos do usuário logado
│   ├── services/
│   │   ├── auth.ts                 # loginWithGoogle, logout, syncUser
│   │   ├── books.ts                # CRUD Firestore /books
│   │   ├── firebase.ts             # Inicialização do Firebase SDK
│   │   ├── loans.ts                # CRUD Firestore /loans + overdue
│   │   └── users.ts                # Leitura/update Firestore /users
│   ├── types/
│   │   └── index.ts                # Interfaces TypeScript (Book, User, Loan)
│   └── utils/
│       └── constants.ts            # Regras de negócio e categorias
└── importar_acervo.py              # Script de importação do Excel
```

---

## 5. Modelos de Dados (Firestore)

O Firestore é um banco NoSQL orientado a documentos. Cada coleção abaixo é uma "tabela".

### Coleção `/books`

Representa um título do acervo (pode ter múltiplos exemplares).

```typescript
interface Book {
  id: string;               // Gerado automaticamente pelo Firestore
  title: string;            // Título do livro
  author: string;           // Autor (pode ser vazio)
  category: string;         // Uma das 22 categorias fixas
  totalQuantity: number;    // Total de exemplares físicos
  availableQuantity: number;// Exemplares disponíveis para empréstimo
  status: 'available'       // Calculado: availableQuantity > 0
         | 'unavailable';
  createdAt: Timestamp;     // Data de cadastro
  updatedAt: Timestamp;     // Data da última alteração
}
```

> **Regra:** `status` é sempre calculado a partir de `availableQuantity`.
> Quando `availableQuantity = 0`, o livro fica `unavailable` e o botão
> "Solicitar Empréstimo" some do catálogo.

---

### Coleção `/users`

Criada automaticamente no primeiro login de cada pessoa.

```typescript
interface User {
  uid: string;              // ID do Firebase Auth (chave do documento)
  email: string;            // Email da conta Google
  name: string;             // Nome completo do Google
  photoURL?: string;        // Foto do perfil do Google (opcional)
  role: 'admin' | 'user';   // Papel — padrão 'user' no primeiro login
  createdAt: Timestamp;     // Data do primeiro acesso
  lastLogin: Timestamp;     // Data do acesso mais recente
  blocked: boolean;         // Se true, não pode fazer empréstimos
}
```

> **Regra:** o primeiro usuário a fazer login recebe `role: 'user'`.
> Uma admin precisa entrar no **Gerenciar Usuários** e promovê-lo manualmente.

---

### Coleção `/loans`

Cada documento é uma solicitação de empréstimo.

```typescript
interface Loan {
  loanId: string;           // ID gerado pelo Firestore
  userId: string;           // uid do usuário que solicitou
  userName: string;         // Nome do usuário (snapshot no momento)
  bookId: string;           // id do livro em /books
  bookTitle: string;        // Título do livro (snapshot no momento)
  loanDate: Timestamp;      // Data da solicitação
  dueDate: Timestamp;       // Data limite de devolução
  returnDate?: Timestamp;   // Data da devolução efetiva (null se não devolvido)
  status: 'pending'         // Aguardando aprovação da admin
         | 'active'         // Aprovado, livro em posse do usuário
         | 'overdue'        // Prazo vencido (marcado automaticamente)
         | 'returned';      // Devolvido (ou rejeitado)
  renewalsUsed: number;     // Quantas renovações já foram feitas (máx 2)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

> **Por que guardar `userName` e `bookTitle` no empréstimo?**
> Denormalização intencional: se um livro for excluído ou um usuário
> trocar de nome, o histórico de empréstimos continua legível.

---

## 6. Camada de Serviços

### `services/firebase.ts` — Inicialização

Arquivo raiz que inicializa o app Firebase e exporta as três instâncias usadas no projeto.

```typescript
const app = initializeApp(firebaseConfig);  // Conecta ao projeto Firebase

export const db      = getFirestore(app);   // Banco de dados
export const auth    = getAuth(app);        // Autenticação
export const storage = getStorage(app);    // Storage (Fase 2)
```

> Todos os outros services importam `db` e `auth` daqui. Isso garante que
> o Firebase seja inicializado **uma única vez** em toda a aplicação.

---

### `services/auth.ts` — Autenticação e Usuários

#### `loginWithGoogle()`
```typescript
export const loginWithGoogle = async (): Promise<void>
```
Abre o **popup do Google** para o usuário escolher a conta. O Firebase cuida de todo o fluxo OAuth. Após o sucesso, o `onAuthStateChanged` no `useAuth` hook detecta a mudança automaticamente.

#### `logout()`
```typescript
export const logout = async (): Promise<void>
```
Encerra a sessão do Firebase Auth. O `onAuthStateChanged` dispara com `null`, zerando o estado de usuário na aplicação.

#### `syncUserWithFirestore(firebaseUser)`
```typescript
export const syncUserWithFirestore = async (firebaseUser): Promise<User>
```
Chamada após cada login bem-sucedido. Faz o seguinte:

1. Busca o documento `/users/{uid}` no Firestore
2. **Se já existe:** atualiza apenas o `lastLogin` e retorna os dados salvos
   (preserva `role` e `blocked` que podem ter sido alterados pela admin)
3. **Se não existe:** cria um novo documento com `role: 'user'` e `blocked: false`

> Essa função garante que as permissões definidas pela admin (role, blocked)
> nunca sejam sobrescritas quando o usuário faz login.

---

### `services/books.ts` — CRUD de Livros

#### `getAllBooks()`
```typescript
export const getAllBooks = async (): Promise<Book[]>
```
Busca todos os livros da coleção `/books` ordenados por título (A-Z).
Usada pelo hook `useBooks` que alimenta o Catálogo e o BooksManager.

#### `getBooksByCategory(category)`
```typescript
export const getBooksByCategory = async (category: string): Promise<Book[]>
```
Busca livros filtrados por categoria diretamente no Firestore (query server-side).
*Atualmente não usada nas telas — o filtro é feito client-side via `filterBooks()` no hook — mas disponível para uso futuro.*

#### `createBook(book)`
```typescript
export const createBook = async (
  book: Omit<Book, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<Book>
```
Cria um novo documento em `/books`. Automaticamente:
- Define `status` baseado em `availableQuantity`
- Adiciona `createdAt` e `updatedAt` com o timestamp atual

#### `updateBook(id, updates)`
```typescript
export const updateBook = async (id: string, updates: Partial<Book>): Promise<void>
```
Atualiza campos específicos de um livro. Se `availableQuantity` for alterado,
recalcula o `status` automaticamente. Também é chamado internamente pelos
serviços de empréstimo quando um livro é aprovado ou devolvido.

#### `deleteBook(id)`
```typescript
export const deleteBook = async (id: string): Promise<void>
```
Remove o documento do Firestore. Não verifica se há empréstimos ativos —
a admin deve verificar antes de deletar.

---

### `services/loans.ts` — Empréstimos

#### `validateLoanRequest(userId)` — validação antes de solicitar
```typescript
export const validateLoanRequest = async (userId: string): Promise<string | null>
```
Verifica duas regras de negócio **antes** de criar a solicitação:

1. Usuário tem algum empréstimo `overdue`? → retorna mensagem de erro
2. Usuário já tem 3 ou mais empréstimos `active`/`pending`? → retorna mensagem de erro

Se tudo estiver OK, retorna `null` (sem erro).

#### `requestLoan(userId, userName, bookId, bookTitle)` — solicitar empréstimo
```typescript
export const requestLoan = async (...): Promise<void>
```
Fluxo:
1. Chama `validateLoanRequest` — lança erro se houver impedimento
2. Cria documento em `/loans` com `status: 'pending'`
3. `dueDate` é calculado como hoje + 15 dias
4. O livro **não** tem `availableQuantity` decrementado ainda (só ao aprovar)

> A aprovação ser manual garante que a admin confirme a entrega física do livro.

#### `approveLoan(loanId, bookId)` — aprovar (admin)
```typescript
export const approveLoan = async (loanId: string, bookId: string): Promise<void>
```
Fluxo:
1. Busca o livro em `/books` — lança erro se não existir
2. Verifica se `availableQuantity > 0` — lança erro se não houver exemplar
3. Atualiza o loan para `status: 'active'`
4. Decrementa `availableQuantity` do livro em 1 (e recalcula `status`)

> As operações no loan e no livro são feitas em sequência (não em transaction).
> Em uma biblioteca pequena isso é suficiente; para alta concorrência,
> usaríamos Firestore Transactions.

#### `rejectLoan(loanId)` — rejeitar (admin)
```typescript
export const rejectLoan = async (loanId: string): Promise<void>
```
Muda o status do loan para `'returned'`. O livro **não** é alterado pois
nunca foi entregue. Usado quando a solicitação não pode ser atendida.

#### `returnLoan(loanId, bookId)` — registrar devolução (admin)
```typescript
export const returnLoan = async (loanId: string, bookId: string): Promise<void>
```
Fluxo:
1. Atualiza o loan: `status: 'returned'`, preenche `returnDate`
2. Busca o livro e incrementa `availableQuantity` em 1
3. Usa `Math.min(total, current + 1)` para nunca exceder `totalQuantity`

#### `renewLoan(loanId, currentDueDate, renewalsUsed)` — renovar (usuário)
```typescript
export const renewLoan = async (
  loanId: string,
  currentDueDate: Timestamp,
  renewalsUsed: number
): Promise<void>
```
Fluxo:
1. Verifica se `renewalsUsed < MAX_RENEWALS` (2) — lança erro se exceder
2. Calcula nova `dueDate`: **data atual de vencimento** + 15 dias
   (não a partir de hoje, para não premiar quem renova tarde)
3. Incrementa `renewalsUsed`

#### `syncOverdueLoans(loans)` — marcar vencidos automaticamente ⭐
```typescript
export const syncOverdueLoans = async (loans: Loan[]): Promise<Loan[]>
```
Chamada **automaticamente** toda vez que `getAllLoans()` ou `getLoansByUser()`
são chamados. Substitui Cloud Functions (que têm custo), resolvendo o problema
client-side:

1. Filtra empréstimos com `status: 'active'` cujo `dueDate` já passou
2. Para cada um, atualiza no Firestore para `status: 'overdue'`
3. Retorna a lista já com os status corrigidos (sem precisar de novo fetch)

> **Custo zero:** funciona sem Cloud Functions. A desvantagem é que
> o status só é atualizado quando alguém abre o app. Para a rotina
> da biblioteca (abertura diária), isso é suficiente.

---

### `services/users.ts` — Gestão de Usuários

#### `getAllUsers()`
```typescript
export const getAllUsers = async (): Promise<User[]>
```
Busca todos os usuários ordenados por data de cadastro (mais recentes primeiro).

#### `setUserRole(uid, role)`
```typescript
export const setUserRole = async (uid: string, role: 'admin' | 'user'): Promise<void>
```
Promove ou rebaixa um usuário. Atualiza apenas o campo `role` no documento.

#### `setUserBlocked(uid, blocked)`
```typescript
export const setUserBlocked = async (uid: string, blocked: boolean): Promise<void>
```
Bloqueia ou desbloqueia um usuário. O campo `blocked: true` impede que
`validateLoanRequest` permita novas solicitações.
> *Observação:* a verificação de `blocked` no `validateLoanRequest` ainda
> não está implementada — ela checa `overdue` e limite de livros, mas
> o campo `blocked` é gerenciado para uso futuro na Fase 2.

---

## 7. Hooks React

### `hooks/useAuth.ts`

Encapsula toda a lógica de autenticação em estado React.

**Estado mantido:**
```typescript
{ user: User | null, loading: boolean, error: string | null }
```

**`useEffect` principal:**
```typescript
onAuthStateChanged(auth, async (firebaseUser) => { ... })
```
O `onAuthStateChanged` é um **listener do Firebase** que dispara:
- Quando o app carrega (verifica se há sessão salva no browser)
- Quando o usuário faz login
- Quando o usuário faz logout

Ao receber um `firebaseUser`, chama `syncUserWithFirestore` para buscar/criar
o perfil completo (com `role` e `blocked`) e salva no estado.

O `useEffect` retorna a função `unsubscribe` — isso cancela o listener
quando o componente é desmontado, evitando vazamento de memória.

**`handleLogin()`:** Chama `loginWithGoogle()` do service e trata erros.

**`handleLogout()`:** Chama `logout()` e zera o estado manualmente
(o listener também dispararia, mas zeramos para resposta imediata na UI).

**`isAdmin`:** Derivado de `state.user?.role === 'admin'` — não tem estado
próprio, é recalculado a cada render.

---

### `hooks/useBooks.ts`

Gerencia o carregamento e filtragem do catálogo.

**`fetchBooks()`:** Chama `getAllBooks()` do service e salva no estado.
Chamado no `useEffect` inicial e também exposto para que as páginas admin
possam recarregar após criar/editar/deletar livros.

**`filterBooks(search, category)`:**
Filtro **client-side** — não faz nova requisição ao Firestore.
Filtra o array já em memória por dois critérios:
- `search`: verifica se o texto está no título **ou** no autor (case-insensitive)
- `category`: correspondência exata com a categoria selecionada

> **Por que client-side?** Com 504 livros, o filtro em memória é instantâneo
> e evita múltiplas queries ao Firestore (que têm limite de leituras no free tier).

---

## 8. Contextos

### `contexts/AuthContext.tsx`

Torna o estado de autenticação disponível para **toda a árvore de componentes**
sem precisar passar props de pai para filho.

```
App
└── AuthProvider (provê o contexto)
    ├── Header          ← usa useAuthContext()
    ├── ProtectedRoute  ← usa useAuthContext()
    ├── Home            ← usa useAuthContext()
    ├── BookCard        ← usa useAuthContext()
    └── ...
```

`AuthProvider` instancia o `useAuth` hook e distribui o resultado via
`AuthContext.Provider`. Qualquer componente filho pode chamar
`useAuthContext()` e ter acesso a:

| Propriedade | Tipo | Descrição |
|---|---|---|
| `user` | `User \| null` | Usuário logado ou null |
| `loading` | `boolean` | true enquanto verifica a sessão |
| `error` | `string \| null` | Mensagem de erro do login |
| `loginWithGoogle` | `() => Promise<void>` | Inicia o login |
| `logout` | `() => Promise<void>` | Encerra a sessão |
| `isAdmin` | `boolean` | true se `user.role === 'admin'` |

---

## 9. Componentes de Layout

### `components/layout/Layout.tsx`

Wrapper simples que aplica a estrutura visual padrão:

```
┌──────────────────────────────┐
│ Header (sticky, z-10)        │
├──────────────────────────────┤
│ <main> max-w-5xl, px-4, py-6 │
│   {children}                 │
│                              │
└──────────────────────────────┘
```

### `components/layout/Header.tsx`

Barra superior fixa com:
- **Logo** (link para Home)
- **Navegação:** Catálogo · Meus Empréstimos · Admin (só para admins)
- **Perfil:** foto do Google + badge "Admin" + botão de sair

O link ativo é destacado visualmente comparando `location.pathname`
com o `to` de cada link.

### `components/layout/ProtectedRoute.tsx`

Guarda de rotas com três comportamentos:

| Condição | Resultado |
|---|---|
| `loading === true` | Mostra spinner de carregamento |
| `user === null` | Redireciona para `/login` |
| `adminOnly && !isAdmin` | Redireciona para `/` (home) |
| Caso contrário | Renderiza `{children}` normalmente |

Usado em todas as rotas que requerem login, e com `adminOnly` nas rotas `/admin/*`.

### `components/books/BookCard.tsx`

Card individual de livro no catálogo. Exibe:
- Placeholder de capa (ícone — foto real na Fase 2)
- Título, autor, categoria
- Badge de disponibilidade com quantidade

**Botão "Solicitar Empréstimo":**
- Visível apenas quando `book.status === 'available'`
- Chama `requestLoan` com os dados do usuário logado (`useAuthContext`)
- Exibe feedback inline (sucesso ou mensagem de erro de validação)
- Desabilitado durante o processamento para evitar duplo clique

---

## 10. Páginas

### `pages/Login.tsx`

Tela pública de entrada. Se o usuário já estiver autenticado (`user !== null`),
redireciona imediatamente para `/` sem renderizar a tela de login.

### `pages/Home.tsx`

Dashboard de boas-vindas. Exibe:
- Card de boas-vindas com o primeiro nome do usuário
- Atalho para o Catálogo
- Atalho para Meus Empréstimos
- **Painel Admin** (visível apenas para `isAdmin === true`) com links para
  Gerenciar Livros, Gerenciar Empréstimos e Usuários

### `pages/Catalog.tsx`

Lista todos os livros do acervo. Usa o hook `useBooks` para carregar
e o `filterBooks` para filtrar em tempo real conforme o usuário digita
ou seleciona uma categoria. Renderiza um grid de `BookCard`.

### `pages/MyLoans.tsx`

Lista os empréstimos do usuário logado. Dois filtros:
- **Ativos** (padrão): mostra `pending`, `active`, `overdue`
- **Histórico completo**: mostra todos, incluindo `returned`

Botão **Renovar** aparece apenas quando `status === 'active'` **e**
`renewalsUsed < MAX_RENEWALS`. Chama `renewLoan` e recarrega a lista.

### `pages/admin/BooksManager.tsx`

CRUD completo de livros com:
- Tabela paginada com busca + filtro por categoria
- Modal **Adicionar livro** (BookForm)
- Modal **Editar livro** (BookForm pré-preenchido)
- Modal **Confirmar exclusão**

`BookForm` é um componente interno da página (não exportado) pois só é
usado aqui. Gerencia estado próprio dos campos do formulário.

### `pages/admin/LoansManager.tsx`

Lista todos os empréstimos com filtros por status. Ações disponíveis:

| Status | Ações |
|---|---|
| `pending` | Aprovar · Rejeitar |
| `active` | Devolver |
| `overdue` | Devolver |
| `returned` | — (somente leitura) |

### `pages/admin/UsersManager.tsx`

Lista todos os usuários cadastrados. Filtros: Todos / Admins / Bloqueados.

Ações por usuário:
- **Tornar admin / Remover admin:** alterna o `role`
- **Bloquear / Desbloquear:** alterna o `blocked`

Proteções:
- A admin logada não pode alterar seu próprio papel nem se bloquear
- O botão de ação é desabilitado enquanto a operação está em curso

---

## 11. Fluxos Principais

### Fluxo de Login

```
Usuário clica "Entrar com Google"
    → loginWithGoogle() abre popup OAuth
    → Firebase autentica e emite evento onAuthStateChanged
    → syncUserWithFirestore() busca/cria perfil no Firestore
    → Estado do contexto é atualizado com User completo
    → ProtectedRoute libera acesso às rotas protegidas
    → Navigate redireciona para "/"
```

### Fluxo de Empréstimo Completo

```
USUÁRIO:
  1. Abre Catálogo → useBooks carrega todos os livros
  2. Clica "Solicitar Empréstimo" no BookCard
     → validateLoanRequest() verifica impedimentos
     → requestLoan() cria loan com status 'pending'
     → Feedback: "Aguarde aprovação"

ADMIN:
  3. Abre Gerenciar Empréstimos
     → getAllLoans() carrega + syncOverdueLoans() verifica vencidos
  4. Vê a solicitação pendente, clica "Aprovar"
     → approveLoan() verifica disponibilidade do livro
     → Loan vira 'active', availableQuantity do livro -1

USUÁRIO (depois):
  5. Pode renovar em Meus Empréstimos (máx 2x)
     → renewLoan() estende dueDate +15 dias

ADMIN (devolução):
  6. Clica "Devolver" no Gerenciar Empréstimos
     → returnLoan() marca como 'returned', availableQuantity +1
```

### Fluxo de Detecção de Overdue

```
Qualquer abertura de tela com empréstimos:
    → getAllLoans() ou getLoansByUser() é chamado
    → syncOverdueLoans() recebe a lista
    → Filtra: status='active' E dueDate < agora
    → Para cada um: updateDoc(status: 'overdue') no Firestore
    → Retorna lista atualizada para a UI
```

---

## 12. Regras de Negócio

Todas definidas em `utils/constants.ts` para fácil manutenção:

```typescript
export const LOAN_DURATION_DAYS = 15;   // Prazo padrão em dias
export const MAX_RENEWALS = 2;           // Máximo de renovações por empréstimo
export const MAX_ACTIVE_LOANS = 3;       // Máximo de livros simultâneos por usuário
```

| Regra | Onde é aplicada |
|---|---|
| Prazo de 15 dias | `requestLoan` (cálculo do `dueDate`) |
| Máx 2 renovações | `renewLoan` (verifica `renewalsUsed`) |
| Limite de 3 livros | `validateLoanRequest` (conta `active + pending`) |
| Bloqueio por atraso | `validateLoanRequest` (verifica `overdue`) |
| Livro indisponível | `approveLoan` (verifica `availableQuantity > 0`) |
| Proteção admin | `ProtectedRoute` (prop `adminOnly`) |

### As 22 categorias fixas

```
Catálogos de Exposição · Fotografia · História, Sociologia, Antropologia, Educação
Povos Indígenas e Populações Tradicionais · Políticas Públicas · Políticas Culturais
Música · Dança · Cinema · Teatro · Artes Plásticas, Artesanato · Patrimônio
Romance · Poesia · Infantil e Infanto-Juvenil · Didáticos · Sertão-Gerais
Cerrado · Educação Ambiental · Meio Ambiente · Mosaico Sertão Veredas-Peruaçu · Turismo
```

---

## 13. Script de Importação do Acervo

`importar_acervo.py` importa os 656 exemplares (504 títulos únicos) do arquivo
`acervo_completo.xlsx` para o Firestore.

### Como usar

```bash
# Pré-requisitos
pip install openpyxl firebase-admin

# 1. Baixar a chave de serviço:
#    Firebase Console → Configurações do projeto
#    → Contas de serviço → Gerar nova chave privada
#    Salvar como: biblioteca_rosa/serviceAccountKey.json

# 2. Testar sem gravar nada
python3 importar_acervo.py --dry-run

# 3. Importar de verdade
python3 importar_acervo.py
```

### Como o script funciona

1. **Lê o Excel:** cada aba = uma categoria. A aba `📋 RESUMO` é ignorada.

2. **Detecta exemplares múltiplos:** linhas com `Nº = "Idem"` são cópias
   do livro imediatamente anterior. O script incrementa `totalQuantity`
   em vez de criar um novo documento.

3. **Parsing do campo cru:** os dados no Excel têm AUTOR + TÍTULO + ANO + ASSUNTO
   colados numa única célula. O script usa heurísticas para separar:
   - Autor com vírgula (`Sobrenome, Nome`) → separa no primeiro par
   - Autor institucional → separa no primeiro `:` ou `–`
   - Ano (regex `\b(19|20)\d{2}\b` ou `s/d`) → descarta o assunto após o ano

4. **Idempotente:** antes de inserir, verifica se já existe um documento
   com o mesmo `(título, categoria)`. Documentos existentes são ignorados,
   então o script pode ser rodado mais de uma vez com segurança.

---

## 14. Variáveis de Ambiente

Arquivo `.env` na raiz do projeto `biblioteca-app/`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=biblioteca-rosa-sertao
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> **Importante:** o prefixo `VITE_` é obrigatório para que o Vite
> exponha as variáveis ao código do browser. Variáveis sem esse prefixo
> ficam disponíveis apenas no processo de build (Node.js), não no app.

O arquivo `.env` está no `.gitignore` e **não deve ser commitado**.
Em produção, as variáveis são configuradas no painel do Firebase Hosting
(ou no ambiente de deploy escolhido).

---

*Documentação gerada em 28/05/2026 · Fase 1 MVP concluída*
