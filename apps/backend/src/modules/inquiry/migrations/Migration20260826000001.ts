import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260826000001 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "wholesale_inquiry" add column if not exists "country" text null;')
    this.addSql('alter table if exists "wholesale_inquiry" add column if not exists "message" text null;')
    this.addSql('alter table if exists "wholesale_inquiry" add column if not exists "status" text not null default \'new\';')
  }
  async down(): Promise<void> {
    this.addSql('alter table if exists "wholesale_inquiry" drop column if exists "country";')
    this.addSql('alter table if exists "wholesale_inquiry" drop column if exists "message";')
    this.addSql('alter table if exists "wholesale_inquiry" drop column if exists "status";')
  }
}
