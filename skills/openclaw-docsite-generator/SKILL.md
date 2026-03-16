---
name: openclaw-docsite-generator
description: Generate, expand, and maintain complete OpenClaw documentation websites with a Next.js-style docs architecture, structured markdown or MDX content, sidebar navigation, and reusable templates. Use when Codex needs to scaffold a new OpenClaw docs portal, reorganize documentation information architecture, add or update tutorial/reference/best-practice pages, or maintain documentation content for beginner, advanced, and production engineering audiences.
---

# OpenClaw Docsite Generator

## Skill Overview

Generate a full OpenClaw documentation portal instead of a single article. Prefer the bundled Next.js-style template unless the user explicitly asks for Docusaurus or VitePress.

Keep the site organized around three learning levels:

- Beginner
- Advanced
- Best Practices

Use the bundled references to keep the information architecture stable and the page quality consistent.

## Skill Inputs

Collect or infer these inputs before generating output:

- documentation goal
- target directory
- whether the user wants a new site or an update to an existing one
- authoritative OpenClaw facts already available in the workspace
- any required product-specific commands, environment variables, or deployment details

If exact OpenClaw commands or config names are unknown, keep the structure and teaching flow intact but leave clearly labeled placeholders instead of inventing unsupported facts.

## Skill Outputs

Produce these deliverables:

- a documentation website project scaffold
- markdown or MDX pages for beginner, advanced, and best-practice tracks
- navigation configuration
- reusable page templates for future topics
- updated section and page scaffolding when the docs site grows

## Execution Flow

### 1. Choose the operating mode

Pick one of these paths:

- New site: scaffold the bundled Next.js-style docs portal.
- Existing site update: add or revise pages, sections, and navigation.
- Template generation: emit a new markdown template for a topic before writing the full page.

### 2. Read only the references you need

Use these files selectively:

- `references/docsite-blueprint.md`: site map, page coverage, generated project structure, and authoring constraints.
- `references/page-templates.md`: frontmatter contract and page skeletons for tutorial, architecture, reference, and best-practice content.

### 3. Scaffold or update the site

Use `scripts/manage_docsite.py` for deterministic operations.

Scaffold a fresh docs site:

```bash
python scripts/manage_docsite.py scaffold --output <target-dir>
```

Scaffold a custom-branded site:

```bash
python scripts/manage_docsite.py scaffold \
  --output <target-dir> \
  --title "OpenClaw Docs" \
  --description "Documentation for OpenClaw users and platform engineers." \
  --tagline "From first agent to production engineering"
```

Add a new section:

```bash
python scripts/manage_docsite.py add-section \
  --site <target-dir> \
  --section-id operations \
  --title "Operations" \
  --description "Runbooks, monitoring, and incident response guidance."
```

Add a new page:

```bash
python scripts/manage_docsite.py add-page \
  --site <target-dir> \
  --section advanced \
  --slug gateway-observability \
  --title "Gateway Observability" \
  --description "Trace traffic, failures, and cost across providers." \
  --template reference
```

Sync navigation after manual edits:

```bash
python scripts/manage_docsite.py sync-nav --site <target-dir>
```

Generate a standalone template:

```bash
python scripts/manage_docsite.py render-template \
  --template best-practice \
  --title "Latency Budgets" \
  --description "Set response-time targets for each agent workflow."
```

### 4. Write documentation like a product engineer

Keep the tone beginner-friendly but developer-oriented.

For every page:

- explain the problem before the mechanism
- show concrete examples, commands, tables, or checklists
- separate starter defaults from verified OpenClaw facts
- prefer actionable comparisons over abstract marketing language

### 5. Preserve the required OpenClaw coverage

Ensure the generated site covers these topics across the three levels:

- what OpenClaw is
- installation and deployment
- first agent
- basic configuration
- architecture
- model strategy
- model providers
- skill ecosystem
- token optimization
- security
- production deployment

### 6. Verify the output

After substantial changes:

1. Run the skill validator on this skill folder.
2. Run the scaffold script against a sample output directory.
3. If you changed navigation or page generation logic, run `sync-nav` and inspect the resulting `content/navigation.json`.

## Project File Structure

This skill is organized like this:

```text
openclaw-docsite-generator/
??? SKILL.md
??? agents/
?   ??? openai.yaml
??? scripts/
?   ??? manage_docsite.py
??? references/
?   ??? docsite-blueprint.md
?   ??? page-templates.md
??? assets/
    ??? next-docsite-template/
        ??? app/
        ??? components/
        ??? content/
        ??? lib/
        ??? package.json
        ??? tsconfig.json
        ??? next.config.mjs
```

The generated documentation site is organized like this:

```text
docs-site/
??? app/
??? components/
??? content/
?   ??? navigation.json
?   ??? docs/
?       ??? beginner/
?       ??? advanced/
?       ??? best-practices/
??? lib/
??? package.json
??? tsconfig.json
```

## Reusable Resources

### `scripts/manage_docsite.py`

Use for deterministic generation and maintenance:

- scaffold a complete site
- add sections
- add pages
- sync navigation from the content tree
- render starter markdown templates

### `references/docsite-blueprint.md`

Read when deciding the information architecture, starter page set, or generated project layout.

### `references/page-templates.md`

Read when authoring new docs pages or when a user asks for templates instead of finished copy.

### `assets/next-docsite-template/`

Copy or modify this template when building a production-ready docs site. It already includes:

- sidebar navigation
- markdown content rendering
- code-block friendly styling
- client-side search
- starter content for beginner, advanced, and best-practice tracks

## Example Usage

Example user requests that should trigger this skill:

- "Build a documentation portal for OpenClaw."
- "Turn our OpenClaw notes into a Vercel-style docs site."
- "Add a new best-practices section about evaluation and observability."
- "Reorganize the OpenClaw docs so beginners can start faster."
- "Generate markdown templates for new OpenClaw documentation topics."

When exact implementation facts are missing, scaffold the full site anyway, mark placeholders clearly, and preserve an upgrade path for later repository-specific edits.
