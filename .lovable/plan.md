## Ajustes solicitados

### 1. Redirecionar para a tela inicial após finalizar o inventário
Em `src/routes/inventaire.$id.compter.tsx`, na função `handleComplete`, substituir:
```ts
navigate({ to: "/inventaire/$id/rapport", params: { id } });
```
por:
```ts
navigate({ to: "/" });
```
Assim, ao clicar em "Enregistrer et terminer", o usuário volta direto para a lista de inventários (e o rapport continua acessível pelo cartão na home, protegido pelo código 2016).

### 2. Tornar todos os inventários visíveis a todos os usuários
Verificar as políticas RLS atuais nas tabelas `inventories` e `inventory_items`. As policies atuais (`inv_select_auth`, `items_select_auth`) já permitem `SELECT` para qualquer usuário `authenticated`, sem filtro por `created_by`. Portanto, todos os inventários já devem aparecer para todos os usuários conectados.

Vou confirmar via `supabase--read_query` que não há filtro adicional aplicado no código (a query em `src/routes/index.tsx` não filtra por `user_id`, apenas ordena por data — ok).

**Conclusão:** nenhuma mudança de código/SQL necessária no item 2 — o comportamento já está correto. Se o usuário ainda não vê inventários de outros, basta confirmar que ele está autenticado. Vou apenas validar isso ao executar e, se houver algum filtro residual descoberto, removê-lo.

### Resumo das alterações
- **`src/routes/inventaire.$id.compter.tsx`**: trocar destino do `navigate` final de `/inventaire/$id/rapport` para `/`.
- Itens 2: nenhuma mudança esperada — políticas já abertas a todos os autenticados.
