const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type IncomingSignup = {
  email?: unknown;
  metadata?: unknown;
};

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => ["string", "number", "boolean"].includes(typeof entry))
      .map(([key, entry]) => [key, String(entry)])
  );
}

async function readSignup(request: Request): Promise<IncomingSignup> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as IncomingSignup;
  }

  const formData = await request.formData();
  return {
    email: formData.get("email"),
  };
}

export async function POST(request: Request) {
  let signup: IncomingSignup;

  try {
    signup = await readSignup(request);
  } catch {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = cleanEmail(signup.email);

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const webhookUrl = process.env.UP_FREE_ACCESS_WEBHOOK_URL;
  const webhookSecret = process.env.UP_FREE_ACCESS_WEBHOOK_SECRET;
  const courseAccessUrl = process.env.UP_FREE_COURSE_ACCESS_URL;

  const payload = {
    email,
    source: "ultimate-pianist-free-tier",
    submittedAt: new Date().toISOString(),
    courseAccessUrl: courseAccessUrl || null,
    offer: {
      name: "The Ultimate Pianist Free Foundation Tier",
      levels: 10,
      lessons: 50,
    },
    metadata: cleanMetadata(signup.metadata),
  };

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return Response.json(
        { error: "The signup service is not responding. Please try again soon." },
        { status: 502 }
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "Email signup is not configured yet." },
      { status: 503 }
    );
  }

  return Response.json({ ok: true, redirectTo: "/free-access" });
}
