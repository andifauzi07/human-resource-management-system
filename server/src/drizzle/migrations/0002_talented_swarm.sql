ALTER TABLE "employees" ADD COLUMN "nik" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_account_number" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_account_name" varchar(150);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_nik_unique" UNIQUE("nik");