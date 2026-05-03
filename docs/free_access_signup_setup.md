# Free Access Signup Setup

The homepage posts email signups to `POST /api/free-access`.

## Required Production Env

Set this before shipping:

```bash
UP_FREE_ACCESS_WEBHOOK_URL="https://your-email-tool-or-automation-webhook"
```

Optional:

```bash
UP_FREE_ACCESS_WEBHOOK_SECRET="shared-secret-for-the-webhook"
UP_FREE_COURSE_ACCESS_URL="https://your-course-access-url"
```

## Webhook Payload

The route forwards JSON like this:

```json
{
  "email": "student@example.com",
  "source": "ultimate-pianist-free-tier",
  "submittedAt": "2026-05-03T00:00:00.000Z",
  "courseAccessUrl": "https://your-course-access-url",
  "offer": {
    "name": "The Ultimate Pianist Free Foundation Tier",
    "levels": 10,
    "lessons": 50
  },
  "metadata": {
    "utm_source": "youtube",
    "sourcePath": "/"
  }
}
```

If `UP_FREE_ACCESS_WEBHOOK_SECRET` is set, the route sends it as:

```text
Authorization: Bearer your-secret
```

## Local Development

In development, the route returns success even when no webhook is configured. This lets the page and confirmation flow be tested locally.

In production, missing `UP_FREE_ACCESS_WEBHOOK_URL` returns a `503` so real signups are not silently lost.
