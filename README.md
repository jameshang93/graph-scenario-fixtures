# graph-scenario-fixtures

Minimal Microsoft Graph API response fixtures for calendar, mail, delta sync, batch, and throttle errors.

## Validate

```bash
npm run validate
```

## Fixtures

- `fixtures/calendar-list.json` — calendar list page
- `fixtures/mail-page.json` — mail page with `@odata.nextLink`
- `fixtures/delta-calendar.json` — delta sync with `@removed`
- `fixtures/graph-error-429.json` — Graph TooManyRequests error body
- `fixtures/batch-response.json` — `$batch` mixed success + 429
- `fixtures/change-notification.json` — Graph webhook change notification

## CI

GitHub Actions runs `npm run validate` on every push and pull request.
