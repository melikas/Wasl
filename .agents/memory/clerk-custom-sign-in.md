---
name: Clerk custom sign-in flows
description: Compatibility guidance for custom password sign-in flows in the Wasl web app.
---

The installed Clerk React package exposes signal-based hooks from its main entrypoint. Legacy custom-flow hooks can cause an invalid-hook-call error when mixed into the current provider/runtime. Use the current Clerk instance and its client sign-in resource for a custom password flow, then activate the returned session.

**Why:** The legacy hook initially type-checked only after switching imports, but failed at runtime because it did not share the app's active React/Clerk context.

**How to apply:** Keep the branded Clerk component for ordinary sign-in, and use a short-lived backend-created Clerk sign-in token with the `ticket` strategy for special public demo access when password sign-in triggers device trust.

Published deployments may use a different Clerk user record than development, even when the app's Clerk flow itself works. Public demo token endpoints should resolve the demo user by stable email/username and synchronize the Wasl member mapping before minting the token.

**Why:** A hardcoded development Clerk user ID caused the published demo endpoint to return 503 while ordinary authenticated production requests continued to work.

**How to apply:** Treat Clerk user IDs as environment-specific for demo provisioning; look up or provision the demo identity at the server boundary, then create the short-lived ticket for that resolved ID.