---
name: routing-guidelines
description: Guidelines for Next.js App Router routing in this project.
user-invocable: false
---

# Routing Guidelines

Apply these rules when writing, reviewing, or refactoring routes in this project.

- MUST use Next.js App Router-based routing.
- SHOULD follow the common RESTful API design principles regarding the path structure.
  - The path structure always SHOULD be repeating the type of resource and the resource identifier.
    - For example, `posts/[id]` instead of `[id]`.
    - For example, `posts/[id]/comments/[id]` instead of `[id]/[id]`.
  - The path elements SHOULD be lowercased and kebab-cased.
  - SHOULD use search params for any optional inputs.
    - For example, use search params for pagination, filtering, and sorting.
    - For example, use search params for language, draft/preview status, etc.
