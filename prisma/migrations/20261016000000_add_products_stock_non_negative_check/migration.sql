-- Defensa en profundidad contra sobreventa: el stock nunca puede quedar negativo.
ALTER TABLE "products" ADD CONSTRAINT "products_stock_non_negative" CHECK ("stock" >= 0);
