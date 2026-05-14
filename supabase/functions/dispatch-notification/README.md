# dispatch-notification

Fan-out push notifications from `notifications_outbox` to Expo Push Service.

## Triggers
- Database Webhook on `notifications_outbox` INSERT (real-time, ~1s latency).
- pg_cron `notifications_retry_pending` (every minute, retries pending rows).

## Secrets required
- `SUPABASE_URL` (built-in).
- `SUPABASE_SERVICE_ROLE_KEY` (built-in).
- `EXPO_ACCESS_TOKEN` (optional but recommended; set via Supabase dashboard → Edge Functions → Secrets).

## Deploy
```bash
supabase functions deploy dispatch-notification --project-ref <REF>
```

## Test locally
```bash
supabase functions serve dispatch-notification --env-file .env.local
# in another shell:
curl -X POST http://localhost:54321/functions/v1/dispatch-notification \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"notifications_outbox","record":{ ... full outbox row ... }}'
```
