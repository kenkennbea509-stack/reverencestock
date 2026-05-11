## Ajustes

### 1. Esconder a quantidade do sistema na tela de comptage
Em `src/routes/inventaire.$id.compter.tsx`, remover a linha `Système : {i.system_qty}` (linhas 181-183) para que cada cartão mostre apenas o nome do produto e o campo de quantidade contada. Os badges Conforme/Manquant/Surplus também serão removidos dessa tela (eles revelam indiretamente o valor do sistema). O cálculo do sistema continua salvo no banco e aparece normalmente no relatório.

### 2. Código de acesso 2016
Criar um pequeno componente `CodeDialog` (`src/components/CodeDialog.tsx`) baseado em `AlertDialog` + `Input` que pede um código de 4 dígitos. Se for `2016`, executa a ação; se errado, mostra toast "Code incorrect" e nega.

Aplicar em duas situações na página inicial (`src/routes/index.tsx`):

- **Abrir um inventário com status `complet`** (ver relatório): o `<Link>` será substituído por um botão que abre o diálogo de código; só após código correto navega para `/inventaire/$id/rapport`. Inventários `en_cours` continuam abrindo direto.
- **Apagar um inventário** (qualquer status): o atual `AlertDialog` "Supprimer ?" passa a exigir o código 2016 no mesmo diálogo (input do código + botões Annuler / Supprimer). A supressão só é executada se o código bater.

O código `2016` fica como constante no componente (atende ao pedido do usuário; sem necessidade de armazenar no backend).

### Resumo dos arquivos
- `src/routes/inventaire.$id.compter.tsx` — remover exibição "Système : X" e os badges de status.
- `src/components/CodeDialog.tsx` — novo componente reutilizável de código.
- `src/routes/index.tsx` — usar o CodeDialog para abrir relatórios completos e para confirmar exclusão.
