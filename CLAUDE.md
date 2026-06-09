# Portaria Front

UI do Portaria. Multi-condomínio, multi-role. Consome a API REST do `portaria` (backend). O destaque é o **editor visual de fluxos de atendimento** (React Flow): cada condomínio monta o grafo de nodes que o motor de chamada executa.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind 4
- **@xyflow/react** (React Flow v12) — editor visual de fluxos
- shadcn/ui sobre **@radix-ui** (a maioria dos primitivos) + algo de **@base-ui/react** — atenção: mistura das duas libs
- TanStack Query (não Redux/Zustand)
- React Hook Form + Zod
- lucide-react (ícones) · sonner (toasts) · next-themes (dark mode) · date-fns (datas pt-BR)

## Comandos

```
make dev          # next dev na porta 3001 (back na 3000)
make build        # next build (output standalone)
make start        # next start
make clean        # rm -rf .next node_modules
npm run lint      # eslint
```

> **Não há `make typecheck`.** Pra checar tipos: `cd /home/bruno/projetos/portaria-front && npx tsc --noEmit`.

## Estrutura

- `src/app/(auth)/` — login (layout centrado, sem sidebar)
- `src/app/(portal)/` — área autenticada (layout com sidebar + header)
- `src/components/` — por feature: `flow-editor/`, `condominiums/`, `calls/`, `layout/` (sidebar, header), `providers/`, `ui/`
- `src/components/ui/` — primitivos shadcn (button, input, dialog, select, tabs, table, badge, etc.)
- `src/components/flow-editor/` — `editor-canvas`, `flow-node`, `config-panel`, `node-palette`
- `src/hooks/` — TanStack Query hooks (`use-condominiums`, `use-flows`, `use-calls`, `use-users`, `use-gates`, `use-extensions`, `use-employees`, etc.)
- `src/contexts/` — `auth-context.tsx` (JWT + user)
- `src/lib/` — `api-client.ts`, `format.ts` (data/telefone/CPF/CNPJ), `node-registry.ts`, `flow-types.ts`, `intent-catalogs.ts`
- `src/schemas/` — Zod schemas (`login.schema.ts`, `condominium.schema.ts`)
- `src/types/` — tipos TS (User, Condominium, Flow, Call, ...)
- `src/middleware.ts` — proteção de rotas por cookie de auth
- `src/services/` — **existe mas está vazia** (estrutura herdada do guardia; aqui os hooks chamam `apiClient` direto)

## Rotas (App Router)

```
/login                                          (auth)
/dashboard                                      stats placeholder + "Popular Banco" (ADM)
/condominios                                    lista + busca
/condominios/[id]                               detalhe (tabs: info, infra, funcionários, fluxos)
/condominios/[id]/editar                        editar dados do condomínio
/condominios/[id]/configuracoes                 portões, ramais, nomenclatura (level1/level2)
/condominios/[id]/fluxos/[flowId]               EDITOR DE FLUXOS (React Flow + painel de config)
/chamadas                                       lista (filtro por condomínio = ADM)
/chamadas/[id]                                  detalhe + timeline de logs
/usuarios                                       CRUD (senha temporária no create)
/auditoria                                      log de auditoria
```

## Editor de fluxos (o coração da UI)

Em `/condominios/[id]/fluxos/[flowId]`, usando `@xyflow/react` com tema dark. Componentes em `src/components/flow-editor/`.

- **Tipos de node** definidos em `src/lib/node-registry.ts` — espelham o backend: `TIMER`, `COMUNICACAO`, `COMANDO`, `COLETAR_DADOS_MORADOR`, `COLETAR_DADOS_VISITA`, `CONTATAR`, `END`, `COLETAR_INTENCAO`, `TRANSFERIR_FLUXO`.
- **`COLETAR_INTENCAO` e `TRANSFERIR_FLUXO` só são permitidos em fluxo ROOT** — `NodePalette` filtra por `isAllowedInFlowType(type, flowType)`. **Máximo 1 fluxo ROOT por condomínio.**
- **Tipos de fluxo** (`src/lib/flow-types.ts`): ROOT, VISITA_MORADOR, IFOOD_MORADOR, ENCOMENDA_MORADOR, ENCOMENDA_CONDOMINIO, PRESTADOR_MORADOR, PRESTADOR_CONDOMINIO.
- **`FlowNode`** (`flow-node.tsx`): badge "ENTRADA" no entry node, botão play (define entry), botão X (deleta). Nodes multi-saída (CONTATAR, COLETAR_DADOS_MORADOR) renderizam uma linha+handle por saída obrigatória, com cores convencionais (verde=confirmado/autorizado, vermelho=negado, cinza=sem resposta).
- **`ConfigPanel`** (`config-panel.tsx`): form por tipo de node. Ex: ComandoForm usa `useGates`; ColetarForm usa `useUnitIdentificationLevels` + `useVisitorDataFields`; ContatarForm escolhe morador/funcionário; EndForm escolhe hangup/transfer/silent (+ ramal).
- **`COLETAR_INTENCAO`** gera saídas dinâmicas a partir do catálogo (`config.catalogKey`: `o_que_deseja` → visita/ifood/encomenda/prestador; `para_quem` → morador/condominio).

### Persistência (save diff-based) — atenção
1. Carrega via `useFlow()` e guarda um **snapshot** pra diff.
2. Edição é toda local (state React). Nodes novos recebem ID temporário `tmp_*`.
3. `handleSave()` aplica o diff: cria nodes novos (resolve `tmp_*` → ID do servidor via `idMap`), atualiza os que mudaram (type/config/posição), deleta edges removidas, deleta nodes removidos, cria edges novas, e seta entry node se mudou.
4. **Edges não têm update** — são deletadas e recriadas.
5. **Validação** roda no backend: `useValidateFlow()` → `{ valid, errors: [{code, message, nodeId?, handle?}] }`. Erros aparecem num popover clicável (clica → seleciona o node no canvas).

## Auth

- `src/contexts/auth-context.tsx`. User: `{ id, name, email, role: 'ADM'|'CLIENT_ADM'|'SUPPORT', condominium_id?, first_access }`.
- **JWT no localStorage** (chave `portaria-auth`) **+ cookie `portaria-auth-status=1`** (7 dias, SameSite=Strict) só pra o middleware Next saber se há sessão.
- Inicialização valida via `GET /api/auth/me`.
- **Middleware** (`src/middleware.ts`): protege `/dashboard`, `/condominios`, `/chamadas`, `/usuarios`, `/auditoria` por presença do cookie. Sem cookie → `/login`. Com cookie em `/login` → `/dashboard`.
- **Logout** limpa localStorage + cookie.
- **Sem refresh token** implementado. 401 no `api-client` → limpa auth + redireciona `/login`.

## Roles / permissões

- Roles: `ADM`, `CLIENT_ADM`, `SUPPORT`.
- **Sidebar** (`src/components/layout/sidebar.tsx`) filtra itens por role:
  - dashboard → ADM
  - condominios, chamadas → ADM, CLIENT_ADM, SUPPORT
  - usuarios → ADM, CLIENT_ADM
  - auditoria → ADM
- **Redirecionamento inteligente:** CLIENT_ADM com `condominium_id` cai direto em `/condominios/{seu_id}`; ADM vê a lista toda.
- Controles finos na UI por role (ex: "Popular Banco" só ADM; filtro de condomínio nas chamadas só ADM; seletor de role/condomínio no create de usuário só ADM). O backend valida de qualquer forma.
- **Não há componente `AccessDenied`** — a granularidade hoje é via filtro de sidebar + checagem no backend.

## API client

- `src/lib/api-client.ts` — wrapper fetch. Base URL via `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).
- Adiciona `Authorization: Bearer {token}` do localStorage. Espera `{ success, data }` / `{ success, error }`. 204 → undefined. 401 → limpa auth + redireciona.
- `stringifyIds()` normaliza IDs numéricos → string (backend usa PKs inteiras).
- Métodos: `get/post/put/delete`. Os hooks chamam `apiClient` direto (não há camada `services/` populada).

## TanStack Query

- Config (`src/components/providers/query-provider.tsx`): `staleTime` 5min, `gcTime` 30min, `retry: 1`, `refetchOnWindowFocus: false`.
- **Sem `refetchInterval`** — não há polling de chamadas em tempo real ainda (dashboard mostra placeholders).
- Mutations invalidam as queries afetadas (ex: create/update/delete de condomínio invalidam `["condominiums"]`).

## Tempo real (Socket.IO)

- **Não implementado no frontend.** Não há cliente socket.io; a lista/detalhe de chamadas é só TanStack Query, e o dashboard tem KPIs placeholder. O backend já tem servidor Socket.IO com rooms, mas ainda não emite eventos de chamada. Dashboard ao vivo é backlog.

## Convenções de UI

- **Primitivos:** maioria `@radix-ui` (avatar, checkbox, dialog, dropdown, popover, select, switch, tabs, tooltip) com algo de `@base-ui/react`. Atenção ao misturar — confira em `src/components/ui/` qual lib cada componente usa antes de mexer.
- **Forms:** react-hook-form + `zodResolver`, schemas em `src/schemas/`.
- **Máscaras:** `maskPhone`, `maskCnpj`, `formatCpf`, `formatPhone` em `src/lib/format.ts` (aplicadas no `onChange`, sem lib de máscara).
- **Datas:** `date-fns` locale pt-BR, formato `dd/MM/yyyy` / `dd/MM/yyyy HH:mm`.
- **Toasts:** `sonner` (`toast.success/error/info`), Toaster no root layout.
- **Tema:** `next-themes` (class-based), dark por padrão, toggle no Header.

## Config

- `next.config.ts`: `output: "standalone"`, `removeConsole` em prod, `optimizePackageImports` (lucide-react, date-fns), headers de segurança + **CSP**. Em prod o front e a API ficam no **mesmo domínio** (`central.portaria.ai`, API roteada por path `/api` no Traefik), então o CSP usa `connect-src 'self'` (same-origin, sem CORS). Em dev, o `connect-src` libera `http://localhost:3000`. A `NEXT_PUBLIC_API_URL` é embutida no build (Dockerfile) — trocar de domínio exige rebuild da imagem.
- `tsconfig.json`: paths `@/*` → `src/*`, strict.
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3000`.
- **Sem Dockerfile / docker-stack / CI no repo** (diferente do guardia-tts-front). O build é `output: standalone` mas o deploy do front ainda não está versionado aqui — confirmar antes de assumir pipeline.

## Gotchas

1. **IDs temporários no editor de fluxo** (`tmp_*`) — resolvidos só no save via `idMap`; edges referenciam o ID resolvido. Edges são delete+recreate (sem update).
2. **CSP fixo em localhost** — ver Config acima; quebra a API em prod se não ajustar `connect-src`.
3. **Mistura Radix + Base UI** — não assuma que um `<Select>` se comporta como o do guardia (lá é Base UI puro). Confira a lib do componente.
4. **`src/services/` vazia** — não procure abstração de API lá; está tudo nos hooks.
5. **Backend usa PKs inteiras** — o `api-client` converte pra string; tipos no front tratam IDs como string.

## Rules of engagement

- **NUNCA rodar `git commit`, `git add`/stage ou `git push` — nem após implementar, nem para "deixar pronto".** Git é responsabilidade exclusiva do usuário. Deixe as mudanças no working tree (sem stage) e apenas avise o que foi alterado.
- **Frontend e backend são repos separados** — push/PR independente. Mudança em campo de API costuma exigir os dois lados.
- **Não criar arquivos `.md`** (README, docs) a menos que pedido. **Não adicionar emojis** em código a menos que pedido.
- **Comentários:** só quando o WHY não é óbvio.
- **Antes de declarar pronto:** `npx tsc --noEmit` deve passar limpo. Validar UI no `make dev` quando a mudança for visual.
- **Estilo:** pushback honesto + plano antes de refactor grande; mudanças pequenas, executa direto. Respostas técnicas, concisas, em português.
