---
trigger: always_on
---

# Project Overview

This project is a personal blog website built on Next.js with [Payload CMS](https://payloadcms.com/).

## Directory Structure

This project follows Next.js file-system conventions

- `app/*` - the Next.js application code. The files under this directory follows [Next.js file-system conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
  - `(app)/*` - the main application code in this repository.
  - `(payload)/*` - the generated code for Payload CMS. Do not edit the files under this directory.
- `e2e/*` - E2E tests and the their helper utilities
- `payload/*` - Payload CMS configurations

### Application Code Directory Structure

Under `app/(app)/`, the files are structured in the following concepts:

- `_/*` - common modules used application-wide
  - `components/*` - React (UI) components
  - `helpers/*` - helper functions, constants or singleton values
  - `repositories/*` - Persistence functions via HTTP(S) or [Payload Local APIs](https://payloadcms.com/docs/local-api/overview)
- For any other files are following [Next.js file-system conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
