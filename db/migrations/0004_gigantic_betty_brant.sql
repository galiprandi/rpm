CREATE TABLE "role_permission" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" text NOT NULL,
	"permission" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "role_permission_role_idx" ON "role_permission" USING btree ("role" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "role_permission_role_permission_key" ON "role_permission" USING btree ("role" text_ops,"permission" text_ops);