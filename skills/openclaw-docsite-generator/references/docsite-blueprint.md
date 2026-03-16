# OpenClaw Docsite Blueprint

## Purpose

Generate a structured documentation portal that teaches OpenClaw from onboarding to production engineering. Keep the content practical, progressive, and easy to extend.

## Audience Ladder

### Beginner

Teach the mental model, installation path, first workflow, and basic configuration.

Required pages:

- `beginner/introduction`
- `beginner/installation-and-deployment`
- `beginner/first-agent`
- `beginner/basic-configuration`

### Advanced

Teach architecture and design choices for teams building larger systems.

Required pages:

- `advanced/architecture`
- `advanced/model-strategy`
- `advanced/model-providers`
- `advanced/skill-ecosystem`
- `advanced/gateway-usage`

### Best Practices

Teach operational excellence, efficiency, and safety.

Required pages:

- `best-practices/token-optimization`
- `best-practices/security`
- `best-practices/production-deployment`

## Required Topic Coverage

Every generated site should explain:

- what OpenClaw is
- why it exists
- the problems it solves
- how it compares with other agent frameworks
- the request flow from user to memory
- installation and deployment expectations
- model selection and provider tradeoffs
- how skills are installed, evaluated, and authored
- token and context optimization methods
- production security risks and mitigations

## Architecture Narrative

Use this sequence in the architecture page:

```text
User -> Agent -> Model -> Tools -> Skills -> Memory
```

Explain each component with:

- responsibility
- input and output shape
- failure modes
- design guidance

## Authoring Rules

- Prefer concrete examples over abstract definitions.
- Use tables for comparisons and decision support.
- Use checklists for setup, review, and deployment guidance.
- Distinguish verified OpenClaw facts from starter placeholders.
- Do not invent exact commands, environment variables, or provider names if the repository does not contain them.
- If facts are missing, keep the page useful with realistic placeholders such as `<openclaw-repo-url>` or `<your-default-model>`.

## Recommended Generated Project Structure

```text
docs-site/
??? app/
?   ??? docs/
?   ?   ??? [[...slug]]/
?   ?       ??? page.tsx
?   ??? globals.css
?   ??? layout.tsx
?   ??? page.tsx
??? components/
?   ??? docs-shell.tsx
?   ??? search-box.tsx
?   ??? sidebar.tsx
??? content/
?   ??? navigation.json
?   ??? docs/
?       ??? beginner/
?       ??? advanced/
?       ??? best-practices/
??? lib/
?   ??? docs.ts
??? next.config.mjs
??? package.json
??? tsconfig.json
```

## Navigation Contract

Store navigation in `content/navigation.json` with this shape:

```json
{
  "site": {
    "title": "OpenClaw Docs",
    "description": "Documentation for OpenClaw users and engineers.",
    "tagline": "From first agent to production engineering"
  },
  "sections": [
    {
      "id": "beginner",
      "title": "Beginner",
      "description": "Start with concepts, setup, and the first working agent.",
      "items": [
        {
          "title": "What is OpenClaw",
          "slug": "beginner/introduction",
          "description": "Learn the OpenClaw mental model.",
          "order": 1
        }
      ]
    }
  ]
}
```

## Writing Checklist

Before shipping a generated site, check that:

- the sidebar follows the three-level learning path
- every page has title, description, and order frontmatter
- setup pages include commands or clearly labeled placeholders
- advanced pages explain tradeoffs, not just features
- best-practice pages include mitigation strategies and review checklists
