/**
 * Cashfree Payment Gateway — Server-side client
 *
 * cashfree-pg v6 constructor signature (positional args):
 *   new Cashfree(XEnvironment, XClientId, XClientSecret, ...)
 *
 * Environment variables required:
 *   CASHFREE_APP_ID     — your Cashfree App ID
 *   CASHFREE_SECRET_KEY — your Cashfree Secret Key
 *   CASHFREE_ENV        — "sandbox" | "production"  (defaults to "sandbox")
 */

import { Cashfree, CFEnvironment } from "cashfree-pg";

const env = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";

// Positional constructor: (environment, clientId, clientSecret)
export const cashfree = new Cashfree(
  env === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID!,
  process.env.CASHFREE_SECRET_KEY!
);

export const CASHFREE_ENV = env;
