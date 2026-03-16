# OpenClaw Page Templates

## Frontmatter Contract

Use this frontmatter on every markdown or MDX page:

```yaml
---
title: Page Title
description: One-sentence summary for search and sidebar previews.
order: 1
---
```

## Tutorial Template

Use for onboarding and first-use pages.

```md
---
title: Topic Title
description: What the reader will accomplish.
order: 1
---

## Why This Matters

Explain the user problem and the outcome.

## Prerequisites

List required environment setup, access, or prior docs.

## Step-by-Step

Walk through the task with commands or configuration snippets.

## What Success Looks Like

Describe the expected result and how to verify it.

## Common Mistakes

Call out the most likely failure modes and fixes.
```

## Architecture Template

Use for system and component design pages.

```md
---
title: Architecture Topic
description: Explain how the parts fit together.
order: 1
---

## System Flow

Show the request path or component diagram.

## Components

Explain each component in a table with responsibilities and tradeoffs.

## Failure Modes

Describe the main risks and how to diagnose them.

## Design Guidance

Provide implementation heuristics for real systems.
```

## Reference Template

Use for providers, gateways, skills, and configuration.

```md
---
title: Reference Topic
description: Explain options, tradeoffs, and recommended defaults.
order: 1
---

## Decision Summary

State the recommended choice for common situations.

## Options Table

Compare providers, settings, or patterns.

## Configuration Example

Show a starter command, config file, or environment block.

## Review Checklist

List the checks a developer should perform before shipping.
```

## Best-Practice Template

Use for token optimization, security, and production operations.

```md
---
title: Best Practice Topic
description: Improve reliability, cost, and safety.
order: 1
---

## Principle

Explain the optimization or safety rule in one paragraph.

## When To Apply It

Describe the situations where it provides leverage.

## Practical Pattern

Show a repeatable implementation pattern or checklist.

## Anti-Patterns

Call out the common mistakes that create instability or waste.
```

## Placeholder Policy

When exact OpenClaw details are not available:

- use realistic placeholders
- label them clearly
- keep the page actionable anyway
- avoid fabricating product-specific commands
