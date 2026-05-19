## Mudança no filtro do CSV

Em `src/lib/csv-parser.ts`, substituir as regras atuais (categorias permitidas + In stock não vazio) por uma única regra:

- Localizar a coluna cujo cabeçalho normalizado seja `track stock`.
- Para cada linha, incluir o produto **apenas se** `row["Track stock"]` (case-insensitive, trim) for `"Y"`. Qualquer outro valor (`N`, vazio, etc.) → ignorar.
- Continuar exigindo `Name` não vazio.
- A coluna `In stock` permanece sendo lida apenas para preencher `systemQty` (sem filtro). Se vazia ou inválida → `0`.
- Se a coluna `Track stock` não existir no CSV → erro claro ("Colonne « Track stock » introuvable").

Categorias deixam de filtrar — atualizar também a mensagem em `src/routes/import.tsx` que hoje diz "catégories filtrées : Boissons alcooliques…" para algo como "Produits avec Track stock = Y".

## Limite de 99 produtos

Verifiquei o código: não existe nenhum cap de 99 nem `.limit()` / `.slice()` nos parsers, inserts ou leituras. O Supabase tem um padrão de 1000 linhas por `select`, bem acima de 99.

O comportamento de 99 que o usuário observou é quase certamente consequência do filtro atual (categorias restritas + In stock vazio). Removendo esses filtros e mantendo apenas `Track stock = Y`, todos os produtos elegíveis da planilha serão importados.

Nenhuma alteração extra de paginação é necessária neste momento. Se após o teste com a planilha real ainda houver corte, investigamos os `select` de `inventory_items` e adicionamos `.range(0, N)` se preciso.

## Verificação

- Rodar o parser contra `export_items_3-2.csv` e contar quantas linhas têm `Track stock = Y`; conferir que o resultado bate.
- Criar um inventário de teste no preview e verificar que todos esses produtos aparecem na tela de contagem (sem corte em 99).
