CREATE TYPE "public"."employee_position" AS ENUM('STAFF', 'MANAGER');--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'PROBATION'::text;--> statement-breakpoint
DROP TYPE "public"."employee_status";--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('PROBATION', 'ACTIVE', 'ON_LEAVE', 'RESIGNED');--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'PROBATION'::"public"."employee_status";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "status" SET DATA TYPE "public"."employee_status" USING "status"::"public"."employee_status";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "position" SET DEFAULT 'STAFF'::"public"."employee_position";--> statement-breakpoint
UPDATE "employees" SET "position" = 'STAFF' WHERE lower("position") = 'staff';--> statement-breakpoint
UPDATE "employees" SET "position" = 'MANAGER' WHERE lower("position") = 'manager';--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "position" SET DATA TYPE "public"."employee_position" USING "position"::"public"."employee_position";