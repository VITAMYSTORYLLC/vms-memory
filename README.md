# vms-memory
A private, local-first app to write and preserve personal stories and memories.

## Recent Fixes
- **Stripe Checkout Local Redirect**: Fixed an issue where successful test payments on localhost redirected the user to the production URL, making it appear as though they were logged out. The `APP_URL` now correctly falls back to `http://localhost:3000` when running `npm run dev` in test mode, keeping the local session intact for other developers testing the payment flow. (Completed March 21, 2026)
