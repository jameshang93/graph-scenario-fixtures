# graph-scenario-fixtures

Minimal Microsoft Graph API response fixtures for calendar, mail, delta sync, batch and throttle errors.

## Validate

```bash
npm run validate
```

## Fixture playback

Load a fixture as a deterministic HTTP-style response: `node scripts/fixture-fetch.js user-profile`

## Scenario packs

Named playback sequences live in `fixtures/scenarios/index.json`. Each pack lists fixture names in call order (for example `mail-sync`, `calendar-delta`, `teams-chat`, `drive-get`). Run `npm test` to verify every referenced fixture exists.

## Fixtures

- `fixtures/user-profile.json` — signed-in user profile from `/me`
- `fixtures/contact.json` — Outlook contact with emailAddresses
- `fixtures/calendar-list.json` — calendar list page
- `fixtures/mail-page.json` — mail page with `@odata.nextLink`
- `fixtures/delta-calendar.json` — delta sync with `@removed`
- `fixtures/graph-error-429.json` — Graph TooManyRequests error body
- `fixtures/batch-response.json` — `$batch` mixed success + 429
- `fixtures/change-notification.json` — Graph webhook change notification
- `fixtures/todo-task-list.json` — To Do task list with mixed statuses

## CI

GitHub Actions runs `npm run validate` on every push and pull request.
