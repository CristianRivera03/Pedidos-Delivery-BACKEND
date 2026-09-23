-- AlterTable
ALTER TABLE "categories" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);
