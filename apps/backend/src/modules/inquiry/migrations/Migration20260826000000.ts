import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260826000000 extends Migration {
  async up(): Promise<void> {
    this.addSql('create table if not exists "wholesale_inquiry" ("id" text not null, "contact_name" text null, "whatsapp" text null, "page_url" text not null, "total_styles" integer not null, "total_pieces" integer not null, "items" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wholesale_inquiry_pkey" primary key ("id"));')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_wholesale_inquiry_deleted_at" ON "wholesale_inquiry" (deleted_at) WHERE deleted_at IS NULL;')
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "wholesale_inquiry" cascade;')
  }
}
