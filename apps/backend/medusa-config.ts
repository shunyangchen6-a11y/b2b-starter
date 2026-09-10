import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { INQUIRY_MODULE } from "./src/modules/inquiry";
import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

// Medusa Cloud injects and manages its own database connection. Retain the
// local DATABASE_URL configuration, but do not override Cloud's managed setup.
const databaseConfig = process.env.MEDUSA_CLOUD_ENVIRONMENT_HANDLE
  ? {}
  : { databaseUrl: process.env.DATABASE_URL };

module.exports = defineConfig({
  projectConfig: {
    ...databaseConfig,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: {
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
    [INQUIRY_MODULE]: {
      resolve: "./modules/inquiry",
    },
  },
});
