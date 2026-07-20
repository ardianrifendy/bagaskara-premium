ALTER TYPE "delivery_mode" ADD VALUE 'PROVIDER_API';--> statement-breakpoint
ALTER TABLE "variants" ADD COLUMN "supplier_product_id" text;