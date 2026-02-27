import type { EnvVarCategory, CategorizedEnvVar } from "@/types/tenant";

const KEY_CATEGORY_MAP: Record<string, EnvVarCategory> = {
  // Core
  NODE_ENV: "core",
  TENANT_ID: "core",
  MONGODB_URI: "core",
  MONGODB_URI_PROD: "core",
  MONGODB_URL: "core",
  PORT: "core",
  SERVER_URL: "core",
  API_URL: "core",

  // Institution
  INSTITUTION_NAME: "institution",
  INSTITUTION_CODE: "institution",
  INSTITUTION_FULL_NAME: "institution",
  INSTITUTION_COUNTRY: "institution",

  // Locale
  TIMEZONE: "locale",
  DEFAULT_LOCALE: "locale",
  DEFAULT_LANGUAGE: "locale",
  CURRENCY: "locale",
  CURRENCY_SYMBOL: "locale",
  CURRENCY_CODE: "locale",

  // Frontend URLs
  FRONTEND_URL: "frontend",
  STUDENT_PORTAL_URL: "frontend",
  ADMIN_PORTAL_URL: "frontend",
  APPLICANT_PORTAL_URL: "frontend",
  MOBILE_APP_URL: "frontend",
  PARENT_PORTAL_URL: "frontend",
  STAFF_PORTAL_URL: "frontend",

  // JWT / Auth
  JWT_SECRET: "jwt",
  JWT_EXPIRES_IN: "jwt",
  JWT_REFRESH_SECRET: "jwt",
  JWT_REFRESH_EXPIRES_IN: "jwt",
  BCRYPT_SALT_ROUNDS: "jwt",

  // Security
  CRON_SECRET: "security",
  CORS_ORIGIN: "security",
  RATE_LIMIT_MAX: "security",
  RATE_LIMIT_WINDOW_MS: "security",

  // Storage / GCS
  GCS_BUCKET_NAME: "storage",
  GCS_BACKUP_BUCKET: "storage",
  GOOGLE_APPLICATION_CREDENTIALS: "storage",
  GOOGLE_CLOUD_PROJECT: "storage",

  // Email
  SES_FROM_EMAIL: "email",
  SES_FROM_NAME: "email",
  SES_REGION: "email",
  AWS_ACCESS_KEY_ID: "email",
  AWS_SECRET_ACCESS_KEY: "email",
  AWS_REGION: "email",
  SENDGRID_API_KEY: "email",
  SMTP_HOST: "email",
  SMTP_PORT: "email",
  SMTP_USER: "email",
  SMTP_PASS: "email",
  EMAIL_FROM: "email",

  // Payment
  PAYUNIT_API_KEY: "payment",
  PAYUNIT_API_SECRET: "payment",
  PAYUNIT_API_URL: "payment",
  PAYUNIT_RETURN_URL: "payment",
  PAYUNIT_NOTIFY_URL: "payment",
  FLUTTERWAVE_PUBLIC_KEY: "payment",
  FLUTTERWAVE_SECRET_KEY: "payment",
  FLUTTERWAVE_ENCRYPTION_KEY: "payment",
  FLUTTERWAVE_HASH: "payment",
  FLUTTERWAVE_PUBLIC_KEY_PROD: "payment",
  FLUTTERWAVE_SECRET_KEY_PROD: "payment",
  FLUTTERWAVE_ENCRYPTION_KEY_PROD: "payment",

  // Upload
  AWS_BUCKET_NAME: "upload",
  UPLOAD_MAX_SIZE: "upload",
  CLOUDINARY_CLOUD_NAME: "upload",
  CLOUDINARY_API_KEY: "upload",
  CLOUDINARY_API_SECRET: "upload",

  // Logging
  LOG_LEVEL: "logging",
  LOG_FORMAT: "logging",

  // Audit
  AUDIT_LOG_ENABLED: "audit",
  AUDIT_LOG_RETENTION_DAYS: "audit",

  // Cache
  REDIS_URL: "cache",
  CACHE_TTL: "cache",
};

const PREFIX_CATEGORY: Array<[string, EnvVarCategory]> = [
  ["FLUTTERWAVE_", "payment"],
  ["PAYUNIT_", "payment"],
  ["AWS_", "email"],
  ["SES_", "email"],
  ["SMTP_", "email"],
  ["JWT_", "jwt"],
  ["GCS_", "storage"],
  ["GOOGLE_", "storage"],
  ["CLOUDINARY_", "upload"],
  ["REDIS_", "cache"],
  ["FRONTEND_", "frontend"],
  ["INSTITUTION_", "institution"],
  ["AUDIT_", "audit"],
];

function getCategory(key: string): EnvVarCategory {
  if (KEY_CATEGORY_MAP[key]) return KEY_CATEGORY_MAP[key];
  for (const [prefix, cat] of PREFIX_CATEGORY) {
    if (key.startsWith(prefix)) return cat;
  }
  return "other";
}

export const CATEGORY_ORDER: EnvVarCategory[] = [
  "core",
  "institution",
  "locale",
  "frontend",
  "jwt",
  "security",
  "storage",
  "email",
  "payment",
  "upload",
  "logging",
  "audit",
  "cache",
  "other",
];

const CATEGORY_LABELS: Record<EnvVarCategory, string> = {
  core: "Core",
  institution: "Institution",
  locale: "Locale & Currency",
  frontend: "Frontend URLs",
  jwt: "JWT & Auth",
  security: "Security",
  storage: "Storage / GCS",
  email: "Email",
  payment: "Payment",
  upload: "Upload",
  logging: "Logging",
  audit: "Audit",
  cache: "Cache",
  other: "Other",
};

export function getCategoryLabel(category: EnvVarCategory): string {
  return CATEGORY_LABELS[category] || category;
}

export function categorizeLiveEnvVars(
  envVars: Record<string, string>,
  storedEnv: Record<string, string>
): CategorizedEnvVar[] {
  return Object.entries(envVars).map(([key, value]) => ({
    key,
    value,
    storedValue: storedEnv[key],
    category: getCategory(key),
    isDifferent: storedEnv[key] !== undefined && storedEnv[key] !== value,
  }));
}
