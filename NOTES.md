# Mublin — Notas Técnicas

Decisões técnicas, referências e anotações de desenvolvimento. Atualizar conforme o projeto evolui.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite |
| UI | Mantine v9 |
| Backend/DB | Supabase (Postgres + RLS) |
| Deploy | Vercel |
| Queries | TanStack Query v5 |
| Formulários | Mantine Form |
| Ícones | Tabler Icons |
| Imagens | ImageKit |

---

## Migração JS → TypeScript (pendente)

### Por que fazer
- Tipar retornos de queries do Supabase
- Segurança nas props de componentes
- Melhor DX conforme o projeto cresce

### Estratégia recomendada (incremental)

1. Instalar TypeScript e tipos necessários:
```bash
npm install -D typescript @types/react @types/react-dom
```

2. Adicionar `tsconfig.json` na raiz:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": false,
    "allowJs": true
  }
}
```

> `"allowJs": true` e `"strict": false` permitem migrar arquivo por arquivo, sem parar o projeto.

3. Renomear `vite.config.js` → `vite.config.ts`

4. Gerar tipos automáticos do Supabase (maior ganho imediato):
```bash
supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/supabase.ts
```

5. Migrar arquivos de queries primeiro (`src/queries/*.ts`) — maior retorno com menor esforço

6. Converter páginas e componentes conforme for tocando neles (`.jsx` → `.tsx`)

### Momento ideal
Feature freeze ou sprint mais calmo. Não é urgente, mas se paga conforme o projeto escala.

---

## Supabase

### RLS — Políticas relevantes

**`project_members` — delete:**
```sql
-- Usuário pode remover sua própria participação
alter policy "Users can delete own project memberships"
on public.project_members
to public
using (auth.uid() = profile_id);
```

**`projects` — delete:**
```sql
-- Usuário pode deletar projetos onde é admin
create policy "Users can delete projects they are admin of"
on public.projects
for delete
to authenticated
using (
  exists (
    select 1 from project_members
    where project_members.project_id = projects.id
      and project_members.profile_id = auth.uid()
      and project_members.is_admin = true
  )
);
```

### FK com CASCADE

A FK `project_members.project_id → projects.id` foi alterada para `ON DELETE CASCADE`:

```sql
alter table project_members
drop constraint project_members_project_id_fkey,
add constraint project_members_project_id_fkey
  foreign key (project_id)
  references projects (id)
  on delete cascade;
```

Ou seja: ao deletar um projeto, todos os `project_members` vinculados são removidos automaticamente.

---

## Padrões adotados

### Lazy import para componentes pesados em modais
```jsx
// Em vez de import estático:
import NewProject from './NewProject'

// Usar lazy para criar chunk separado (Vite cuida do resto):
const NewProject = lazy(() => import('./NewProject'))

// No JSX, envolver com Suspense:
<Suspense fallback={<Loader />}>
  <NewProject />
</Suspense>
```

### Callback onSuccess em componentes reutilizáveis
Componentes de página (ex: `NewProject`) aceitam prop opcional `onSuccess` para funcionar tanto como página standalone quanto dentro de modais:

```jsx
export default function NewProject({ onSuccess }) {
  // ...
  if (onSuccess) {
    onSuccess() // fecha modal
  } else {
    navigate(`/project/${slug}`) // navega normalmente
  }
}
```

### Invalidação de queries após mutação
```jsx
const queryClient = useQueryClient()

<NewProject
  onSuccess={() => {
    queryClient.invalidateQueries({ queryKey: ['profile-projects', user?.id] })
    closeModal()
  }}
/>
```

### Select do Mantine com grupos
```jsx
const genresList = categories.map((category) => ({
  group: category.name,
  items: items
    .filter((i) => i.category_id === category.id)
    .map((i) => ({ value: String(i.id), label: i.name })),
}))

// value SEMPRE string — Mantine não aceita número
```

### Botões de navegação fixos no bottom
```jsx
<Group
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px',
    backgroundColor: 'var(--mantine-color-body)',
    borderTop: '1px solid var(--mantine-color-default-border)',
    zIndex: 100,
  }}
>
```

Adicionar `pb={100}` no container pai para o conteúdo não ficar escondido atrás dos botões.

### Dropdown de Select sempre abrindo abaixo (útil em modais)
```jsx
<Select
  comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
/>
```

---

## Observações gerais

- `useCombobox` e outros hooks do Mantine **nunca** podem ser chamados após um `return` condicional — sempre no topo do componente
- `form.key()` só é necessário no modo `uncontrolled` do Mantine Form — no modo padrão (controlado) pode ser omitido e evita conflito de keys
- Valores de `Select` e `Combobox` do Mantine devem ser sempre `string` — usar `String(id)` ao mapear arrays
- Queries do Supabase com relações inversas (sem FK direta) funcionam normalmente via PostgREST — ex: `projects` retornando `project_members` aninhado
- Filtros em relações aninhadas usam notação `tabela.coluna`: `.eq('project_members.status', 2)`
