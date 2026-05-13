## Objetivo

Adicionar uma regra complementar no parser do CSV (`src/lib/csv-parser.ts`): se a coluna que contém "In stock" estiver **vazia** para um produto, ele é ignorado. Se tiver qualquer valor (0, negativo ou positivo), o produto é incluído normalmente.

As regras atuais permanecem ativas:
- Filtro por categorias permitidas (Boissons alcooliques, Boissons gazeuses, Lait, Fruit)
- Nome obrigatório

## Mudança

Em `src/lib/csv-parser.ts`, dentro do loop `for (const row of result.data)`:

1. Ler `rawStockRaw = (row[stockColumn] ?? "").trim()` **antes** de qualquer normalização.
2. Se `rawStockRaw === ""`, fazer `continue` (pular o produto).
3. Caso contrário, manter a lógica atual de limpeza/`parseFloat`. Se ainda assim for `NaN` (ex.: texto inválido), usar `0` como hoje — mas valores `0`, `0.000` e negativos passam normalmente.

Ordem das verificações no loop:
1. Categoria permitida (existente)
2. Nome não vazio (existente)
3. **Novo:** valor de "In stock" não vazio
4. Push do produto

## Verificação

- Confirmar com o CSV enviado (`export_items_3.csv`) que linhas como `banane-au-foie-100` (In stock vazio, mas categoria "Plats" — já filtrada) e produtos de bebidas com `0.000` continuam com o comportamento esperado.
- Produtos das categorias permitidas com In stock vazio passam a ser ignorados; com `0.000` ou negativos continuam incluídos.
- Nenhuma alteração em `src/routes/import.tsx`, no fluxo de criação, na contagem ou nos relatórios — a regra fica isolada no parser.
