CREATE TYPE "public"."budget_period" AS ENUM('MONTHLY', 'QUARTERLY', 'YEARLY');--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"category_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"period" "budget_period" DEFAULT 'MONTHLY' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_amount_check" CHECK ("budgets"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "tags_name_unique";--> statement-breakpoint
DROP INDEX "tags_name_idx";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_user_id_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "budgets_category_idx" ON "budgets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "budgets_period_idx" ON "budgets" USING btree ("period");--> statement-breakpoint
CREATE INDEX "budgets_start_date_idx" ON "budgets" USING btree ("start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_category_period_unique" ON "budgets" USING btree ("user_id","category_id","period","start_date");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_unique" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id","date" DESC NULLS LAST);