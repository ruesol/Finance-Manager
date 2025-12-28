ALTER TABLE "tags" DROP CONSTRAINT "tags_name_unique";--> statement-breakpoint
DROP INDEX "tags_name_idx";--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_unique" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id","date" DESC NULLS LAST);