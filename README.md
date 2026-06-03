# 📚 Biblioteca e Museu Comunitário Seu Duchim

Sistema de gestão de acervo e empréstimos da **Biblioteca e Museu Comunitário Seu Duchim**, desenvolvido para o **Instituto Rosa e Sertão** — Chapada Gaúcha, Minas Gerais.

---

## Sobre o projeto

A biblioteca do Instituto Rosa e Sertão conta com um acervo de **656 exemplares** distribuídos em **22 categorias temáticas**, com foco em cultura, meio ambiente, sertão e povos tradicionais. Antes deste sistema, o controle de empréstimos era feito manualmente.

Este app substitui o controle manual, permitindo que usuárias solicitem empréstimos pelo celular e que as administradoras gerenciem o acervo de qualquer lugar.

---

## Funcionalidades

### Para usuárias
- Login com conta Google
- Catálogo completo com busca por título, autor e filtro por categoria
- Solicitação de empréstimos diretamente pelo catálogo
- Acompanhamento de empréstimos ativos e histórico
- Renovação de empréstimos (até 2 renovações, +15 dias cada)

### Para administradoras
- Painel administrativo com acesso a todas as áreas
- Cadastro, edição e remoção de livros do acervo
- Aprovação, rejeição e registro de devoluções de empréstimos
- Detecção automática de empréstimos em atraso
- Gerenciamento de usuárias (papéis e bloqueios)

### Regras de empréstimo
| Regra | Valor |
|-------|-------|
| Prazo de devolução | 15 dias |
| Renovações permitidas | 2 (+ 15 dias cada) |
| Limite simultâneo | 3 livros por usuária |
| Bloqueio | Automático se houver atraso |

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilização | TailwindCSS |
| Roteamento | React Router DOM |
| Autenticação | Firebase Authentication (Google) |
| Banco de dados | Firebase Firestore |
| Ícones | Lucide React |

> O app roda 100% no **Firebase Free Tier (Spark)** — sem custo de infraestrutura.

---

## Estrutura do projeto

```
biblioteca-rosa-e-sertao/
├── biblioteca-app/          # Aplicação React
│   └── src/
│       ├── components/      # Header, Layout, BookCard, ProtectedRoute
│       ├── contexts/        # AuthContext (estado global de autenticação)
│       ├── hooks/           # useAuth, useBooks
│       ├── pages/           # Login, Home, Catalog, MyLoans
│       │   └── admin/       # BooksManager, LoansManager, UsersManager
│       ├── services/        # Integração com Firebase (auth, books, loans, users)
│       ├── types/           # Interfaces TypeScript (Book, User, Loan)
│       └── utils/           # Constantes e 22 categorias fixas
├── importar_acervo.py       # Script de importação do Excel para o Firestore
├── DOCUMENTACAO_FASE1.md    # Documentação técnica completa
└── README.md
```

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Uma conta no [Firebase Console](https://console.firebase.google.com)

### 1. Clone o repositório

```bash
git clone https://github.com/flaviadeassisbrasil/biblioteca-rosa-e-sertao.git
cd biblioteca-rosa-e-sertao/biblioteca-app
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie o arquivo `.env` dentro de `biblioteca-app/` com as credenciais do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> As credenciais estão em: **Firebase Console → Configurações do projeto → Seus apps**

### 4. Configure o Firebase

No Firebase Console, ative:
- **Authentication → Sign-in method → Google** (ativar)
- **Firestore Database** → criar banco e aplicar as regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Rode o app

```bash
npm run dev
```

Acesse **http://localhost:5173**

---

## Importação do acervo

Para importar os livros do arquivo Excel para o Firestore:

```bash
# Na raiz do projeto
pip install openpyxl firebase-admin

# Teste sem gravar nada
python3 importar_acervo.py --dry-run

# Importa de verdade (precisa do serviceAccountKey.json)
python3 importar_acervo.py
```

> O arquivo `serviceAccountKey.json` é baixado em:
> **Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada**
> Nunca commite esse arquivo.

---

## Fases de desenvolvimento

- [x] **Fase 1 — MVP:** Auth Google · Catálogo · CRUD admin · Empréstimos · Painel admin
- [ ] **Fase 2:** APK Android (Capacitor) · Upload de capas · Dashboard · Notificações
- [ ] **Fase 3:** Relatórios com BigQuery + Looker Studio

---

## Instituto Rosa e Sertão

O [Instituto Rosa e Sertão](https://www.rosaesertao.org.br) é uma organização da sociedade civil localizada em Chapada Gaúcha - MG, que atua na promoção da cultura, da memória e do desenvolvimento sustentável no Sertão Mineiro.

---

*Desenvolvido com carinho para a comunidade de Chapada Gaúcha 🌿*
