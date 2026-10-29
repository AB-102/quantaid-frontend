# transactional

Email templates built with [React Email](https://react.email/docs/introduction). The backend sends them through Resend.

> **Naming convention:** Use `snake_case` for all template files (e.g. `welcome.tsx`). The exported `.html` filenames must match the names `quantaid-backend/services/email_service.py` loads.

---

## What is React Email?

React Email lets you write email templates as React components. At export time it converts the component tree into a plain HTML string that any email provider can send (we use Resend). You get component reuse, TypeScript, Tailwind classes that get inlined into email-safe styles, and a live preview server, without fighting raw HTML tables.

Since React Email 6, the components, the renderer and the `email` CLI all come from the `react-email` package (`@react-email/components` is deprecated). The preview server is the separate `@react-email/ui` package.

**Simple example:**

```tsx
import { Html, Heading, Text } from 'react-email';

// Placeholder constant, exported literally into the HTML so the backend can
// substitute the real value at send time via simple string replacement.
const USER_NAME = '{{user_name}}';

export default function Example() {
  return (
    <Html>
      <Heading>Welcome to Quantaid</Heading>
      <Text>Hi {USER_NAME}, your account is ready.</Text>
    </Html>
  );
}
```

> [!NOTE]
> A full working example with the logo and the dev/prod switch is [`emails/welcome.tsx`](emails/welcome.tsx).

---

## Development

Requires Node.js 20.19 or newer, the same as `frontend/`. This package is separate from `frontend/` (its own `package.json` and lockfile), so frontend CI and builds ignore it.

```bash
cd transactional
npm install
npm run dev
```

This opens the preview server (usually at `http://localhost:3000`) with hot reload, showing all templates in `emails/`.

`react-email` and `@react-email/ui` are pinned to the same exact version, because the CLI won't start the preview server when they differ. Upgrade them together.

### Images and static assets

> **Disclaimer:** Email clients block data URIs and have no filesystem access, so `<Img src>` must be an **absolute URL** in any exported or sent email. Use PNG (or JPG): Gmail and Outlook don't render SVG. The approach below is for local preview only.

Templates run in Node.js, so for the preview server you can read a local file and encode it as a base64 data URI. Relative paths and `public/` directory serving do **not** work, because the preview server doesn't expose the filesystem. Build paths from `process.cwd()` (npm runs scripts from `transactional/`), not `__dirname`, which points wherever React Email bundles the template.

```tsx
import { readFileSync } from 'fs';
import { join } from 'path';

const svg = readFileSync(join(process.cwd(), '../frontend/src/assets/quantaid-logo.svg'));
const logoSrc = `data:image/svg+xml;base64,${svg.toString('base64')}`;
// Then: <Img src={logoSrc} ... />
```

Each template has a commented `// DEV` block with this, and a `// PROD` block with the hosted URLs. Swap to DEV to preview, and back to PROD before `npm run export`.

Hosted email images live in `frontend/public/`, so they deploy with the site. For example, `frontend/public/email-logo.png` (`quantaid-logo.svg` rasterized at 2x) is served at `https://quantaid.org/email-logo.png`. Ship a new image with a frontend deploy before any email references it.

---

## Exporting to HTML

When templates are ready, export them to static HTML files:

```bash
npm run export
```

This writes one `.html` file per template into `transactional/out/` (gitignored).

**Then copy those `.html` files into the backend and commit them there:**

| Destination | Used by |
|---|---|
| `quantaid-backend/emails/` | Python (read at runtime via `pathlib`) |

(The paper-trading project this setup came from kept two copies because its Go backend embeds templates with `//go:embed`, which can't reference paths outside its module. Quantaid has one backend, so there's one copy.)

**Dynamic values** (names, links, etc.) are not passed as props. Instead, use literal placeholder strings in the template (e.g. `{{user_name}}`), which the backend substitutes, HTML-escaped, before sending. See [`emails/welcome.tsx`](emails/welcome.tsx) for the pattern.

---

## Resources

- [Introduction](https://react.email/docs/introduction)
- [Component library](https://react.email/components)
- [Template gallery](https://react.email/templates)
