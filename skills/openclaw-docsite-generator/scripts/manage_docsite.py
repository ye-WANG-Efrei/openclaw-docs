#!/usr/bin/env python3
"""Scaffold and maintain the OpenClaw documentation site template."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

TEXT_EXTENSIONS = {
    ".css",
    ".d.ts",
    ".json",
    ".md",
    ".mdx",
    ".mjs",
    ".ts",
    ".tsx",
    ".txt",
}

PLACEHOLDERS = {
    "__DOCSITE_TITLE__": "OpenClaw Docs",
    "__DOCSITE_DESCRIPTION__": "Documentation for OpenClaw users and platform engineers.",
    "__DOCSITE_TAGLINE__": "From first agent to production engineering",
}

PAGE_TEMPLATES = {
    "tutorial": '''---
title: __TITLE__
description: __DESCRIPTION__
order: __ORDER__
---

## Why This Matters

Explain the user problem this page solves for OpenClaw users.

## Prerequisites

- Access to the relevant OpenClaw environment
- The required model or provider credentials
- Any repository, gateway, or deployment prerequisites

## Step-by-Step

1. Describe the first setup or decision.
2. Show the exact command, config, or UI action.
3. Explain what result the reader should see next.

```bash
# Replace with the exact OpenClaw command for this workflow.
<command-goes-here>
```

## What Success Looks Like

Describe the expected outcome and how to validate it.

## Common Mistakes

- Call out the most likely configuration or permission issue.
- Explain the quickest correction path.
''',
    "reference": '''---
title: __TITLE__
description: __DESCRIPTION__
order: __ORDER__
---

## Decision Summary

State the recommended default for most OpenClaw teams.

## Options Table

| Option | Best For | Strengths | Tradeoffs |
| --- | --- | --- | --- |
| Option A | Starter workflows | Fast setup | Limited flexibility |
| Option B | Production systems | Better control | More maintenance |

## Configuration Example

```env
# Replace placeholders with repository-specific values.
OPENCLAW_SETTING=<value>
```

## Review Checklist

- Confirm the setting matches the workload.
- Confirm fallbacks and failure handling are documented.
- Confirm the page links to adjacent architecture or operations docs.
''',
    "architecture": '''---
title: __TITLE__
description: __DESCRIPTION__
order: __ORDER__
---

## System Flow

```text
User -> Agent -> Model -> Tools -> Skills -> Memory
```

## Component Responsibilities

| Component | Responsibility | Questions To Answer |
| --- | --- | --- |
| User | Defines the task and constraints | What is the desired outcome? |
| Agent | Orchestrates execution | How does it break down the task? |
| Model | Produces reasoning or generation | Which capability is required? |
| Tools | Act on the outside world | What permissions are necessary? |
| Skills | Provide procedural knowledge | Which workflow should trigger? |
| Memory | Preserve useful context | What should persist across runs? |

## Failure Modes

- Identify the most common breakdown points.
- Explain how to observe, debug, and recover from them.

## Design Guidance

Summarize the architectural rules that help OpenClaw stay maintainable.
''',
    "best-practice": '''---
title: __TITLE__
description: __DESCRIPTION__
order: __ORDER__
---

## Principle

State the optimization or safety principle in one paragraph.

## When To Apply It

Describe the workloads where this best practice matters most.

## Practical Pattern

1. Define the operating constraint.
2. Apply the recommended OpenClaw pattern.
3. Measure the result and adjust.

## Anti-Patterns

- Name the shortcut that creates avoidable risk or waste.
- Explain the safer alternative.

## Review Checklist

- Add a measurable success signal.
- Add an owner or review cadence if the topic is operational.
''',
}


def humanize(value: str) -> str:
    return value.replace("-", " ").replace("_", " ").strip().title()


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-")


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    match = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if not match:
        return {}, text

    data: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    content = text[match.end() :].lstrip()
    return data, content


def template_root() -> Path:
    return Path(__file__).resolve().parents[1] / "assets" / "next-docsite-template"


def navigation_path(site_dir: Path) -> Path:
    return site_dir / "content" / "navigation.json"


def docs_root(site_dir: Path) -> Path:
    return site_dir / "content" / "docs"


def read_navigation(site_dir: Path) -> dict:
    path = navigation_path(site_dir)
    if not path.exists():
        raise SystemExit(f"Navigation file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_navigation(site_dir: Path, navigation: dict) -> None:
    path = navigation_path(site_dir)
    path.write_text(json.dumps(navigation, indent=2) + "\n", encoding="utf-8")


def ensure_site(site_dir: Path) -> None:
    if not navigation_path(site_dir).exists() or not docs_root(site_dir).exists():
        raise SystemExit(
            "The target does not look like a generated docs site. "
            "Expected content/navigation.json and content/docs/."
        )


def render_template(kind: str, title: str, description: str, order: int) -> str:
    if kind not in PAGE_TEMPLATES:
        allowed = ", ".join(sorted(PAGE_TEMPLATES))
        raise SystemExit(f"Unknown template '{kind}'. Allowed: {allowed}")

    rendered = PAGE_TEMPLATES[kind]
    rendered = rendered.replace("__TITLE__", title)
    rendered = rendered.replace("__DESCRIPTION__", description)
    rendered = rendered.replace("__ORDER__", str(order))
    return rendered


def copy_template(source: Path, destination: Path, replacements: dict[str, str], force: bool) -> None:
    if destination.exists() and any(destination.iterdir()):
        if not force:
            raise SystemExit(
                f"Output directory already exists and is not empty: {destination}. "
                "Pass --force to replace it."
            )
        shutil.rmtree(destination)

    destination.mkdir(parents=True, exist_ok=True)

    for path in source.rglob("*"):
        relative = path.relative_to(source)
        target = destination / relative

        if path.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue

        if path.suffix.lower() in TEXT_EXTENSIONS:
            content = path.read_text(encoding="utf-8")
            for old, new in replacements.items():
                content = content.replace(old, new)
            target.write_text(content, encoding="utf-8")
        else:
            shutil.copy2(path, target)


def next_page_order(items: list[dict]) -> int:
    if not items:
        return 1
    return max(int(item.get("order", 0)) for item in items) + 1


def get_or_create_section(navigation: dict, section_id: str, title: str | None, description: str | None) -> dict:
    for section in navigation.get("sections", []):
        if section.get("id") == section_id:
            if title:
                section["title"] = title
            if description:
                section["description"] = description
            section.setdefault("items", [])
            return section

    section = {
        "id": section_id,
        "title": title or humanize(section_id),
        "description": description or f"Documentation for {humanize(section_id).lower()} topics.",
        "items": [],
    }
    navigation.setdefault("sections", []).append(section)
    return section


def upsert_item(section: dict, item: dict) -> None:
    items = section.setdefault("items", [])
    for index, existing in enumerate(items):
        if existing.get("slug") == item.get("slug"):
            items[index] = item
            return
    items.append(item)


def scaffold(args: argparse.Namespace) -> None:
    source = template_root()
    destination = Path(args.output).resolve()
    replacements = {
        "__DOCSITE_TITLE__": args.title,
        "__DOCSITE_DESCRIPTION__": args.description,
        "__DOCSITE_TAGLINE__": args.tagline,
    }
    copy_template(source, destination, replacements, args.force)
    print(f"Scaffolded docs site at {destination}")


def add_section(args: argparse.Namespace) -> None:
    site_dir = Path(args.site).resolve()
    ensure_site(site_dir)

    section_id = slugify(args.section_id)
    if not section_id:
        raise SystemExit("Section id must include at least one letter or digit.")

    navigation = read_navigation(site_dir)
    section = get_or_create_section(navigation, section_id, args.title, args.description)
    write_navigation(site_dir, navigation)

    (docs_root(site_dir) / section_id).mkdir(parents=True, exist_ok=True)
    print(f"Section ready: {section['title']} ({section_id})")


def add_page(args: argparse.Namespace) -> None:
    site_dir = Path(args.site).resolve()
    ensure_site(site_dir)

    section_id = slugify(args.section)
    slug = slugify(args.slug)
    if not section_id or not slug:
        raise SystemExit("Section and slug must include at least one letter or digit.")

    navigation = read_navigation(site_dir)
    section = get_or_create_section(navigation, section_id, None, None)
    order = args.order or next_page_order(section.get("items", []))

    page_dir = docs_root(site_dir) / section_id
    page_dir.mkdir(parents=True, exist_ok=True)
    page_path = page_dir / f"{slug}.mdx"
    if page_path.exists() and not args.force:
        raise SystemExit(f"Page already exists: {page_path}. Pass --force to overwrite it.")

    content = render_template(args.template, args.title, args.description, order)
    page_path.write_text(content, encoding="utf-8")

    item = {
        "title": args.title,
        "slug": f"{section_id}/{slug}",
        "description": args.description,
        "order": order,
    }
    upsert_item(section, item)
    section["items"] = sorted(
        section["items"],
        key=lambda value: (int(value.get("order", 999)), value.get("title", "")),
    )
    write_navigation(site_dir, navigation)
    print(f"Page written: {page_path}")


def collect_docs(site_dir: Path) -> list[dict]:
    entries: list[dict] = []
    for file_path in sorted(docs_root(site_dir).rglob("*.mdx")):
        relative = file_path.relative_to(docs_root(site_dir)).as_posix()
        section_id, _, page_name = relative.partition("/")
        raw = file_path.read_text(encoding="utf-8")
        frontmatter, _ = parse_frontmatter(raw)
        slug = relative.removesuffix(".mdx")
        entries.append(
            {
                "section_id": section_id,
                "title": frontmatter.get("title") or humanize(page_name.removesuffix(".mdx")),
                "description": frontmatter.get("description") or "",
                "order": int(frontmatter.get("order") or 999),
                "slug": slug,
            }
        )
    return entries


def sync_nav(args: argparse.Namespace) -> None:
    site_dir = Path(args.site).resolve()
    ensure_site(site_dir)

    existing = read_navigation(site_dir)
    existing_sections = {section["id"]: section for section in existing.get("sections", [])}
    rebuilt = {
        "site": existing.get(
            "site",
            {
                "title": PLACEHOLDERS["__DOCSITE_TITLE__"],
                "description": PLACEHOLDERS["__DOCSITE_DESCRIPTION__"],
                "tagline": PLACEHOLDERS["__DOCSITE_TAGLINE__"],
            },
        ),
        "sections": [],
    }

    grouped: dict[str, list[dict]] = {}
    for entry in collect_docs(site_dir):
        grouped.setdefault(entry["section_id"], []).append(entry)

    ordered_section_ids: list[str] = []
    for section in existing.get("sections", []):
        section_id = section.get("id")
        if isinstance(section_id, str) and section_id in grouped:
            ordered_section_ids.append(section_id)

    for section_id in sorted(grouped):
        if section_id not in ordered_section_ids:
            ordered_section_ids.append(section_id)

    for section_id in ordered_section_ids:
        current = existing_sections.get(section_id, {})
        items = sorted(grouped[section_id], key=lambda value: (value["order"], value["title"]))
        rebuilt["sections"].append(
            {
                "id": section_id,
                "title": current.get("title") or humanize(section_id),
                "description": current.get("description")
                or f"Documentation for {humanize(section_id).lower()} topics.",
                "items": [
                    {
                        "title": item["title"],
                        "slug": item["slug"],
                        "description": item["description"],
                        "order": item["order"],
                    }
                    for item in items
                ],
            }
        )

    write_navigation(site_dir, rebuilt)
    print(f"Navigation synced: {navigation_path(site_dir)}")


def render_template_command(args: argparse.Namespace) -> None:
    output_path = Path(args.output).resolve() if args.output else None
    order = args.order

    if order is None and output_path is not None:
        sibling_orders: list[int] = []
        if output_path.parent.exists():
            for sibling in sorted(output_path.parent.glob("*.mdx")):
                if sibling == output_path:
                    continue
                frontmatter, _ = parse_frontmatter(sibling.read_text(encoding="utf-8"))
                raw_order = frontmatter.get("order")
                if raw_order is None:
                    continue
                try:
                    sibling_orders.append(int(raw_order))
                except ValueError:
                    continue
        order = max(sibling_orders) + 1 if sibling_orders else 1

    content = render_template(args.template, args.title, args.description, order or 1)
    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        print(f"Template written: {output_path}")
        return
    sys.stdout.write(content)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scaffold and maintain the OpenClaw documentation site.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    scaffold_parser = subparsers.add_parser("scaffold", help="Copy the bundled docs site template.")
    scaffold_parser.add_argument("--output", required=True, help="Target directory for the generated site.")
    scaffold_parser.add_argument("--title", default=PLACEHOLDERS["__DOCSITE_TITLE__"])
    scaffold_parser.add_argument("--description", default=PLACEHOLDERS["__DOCSITE_DESCRIPTION__"])
    scaffold_parser.add_argument("--tagline", default=PLACEHOLDERS["__DOCSITE_TAGLINE__"])
    scaffold_parser.add_argument("--force", action="store_true", help="Replace an existing non-empty directory.")
    scaffold_parser.set_defaults(func=scaffold)

    add_section_parser = subparsers.add_parser("add-section", help="Create a new navigation section.")
    add_section_parser.add_argument("--site", required=True, help="Generated docs site directory.")
    add_section_parser.add_argument("--section-id", required=True, help="Section identifier.")
    add_section_parser.add_argument("--title", help="Human-readable section title.")
    add_section_parser.add_argument("--description", help="Section summary.")
    add_section_parser.set_defaults(func=add_section)

    add_page_parser = subparsers.add_parser("add-page", help="Create a new docs page and register it.")
    add_page_parser.add_argument("--site", required=True, help="Generated docs site directory.")
    add_page_parser.add_argument("--section", required=True, help="Section id such as beginner or advanced.")
    add_page_parser.add_argument("--slug", required=True, help="Page slug without extension.")
    add_page_parser.add_argument("--title", required=True, help="Page title.")
    add_page_parser.add_argument("--description", required=True, help="Page description.")
    add_page_parser.add_argument(
        "--template",
        default="tutorial",
        choices=sorted(PAGE_TEMPLATES),
        help="Starter template to use.",
    )
    add_page_parser.add_argument("--order", type=int, help="Sidebar ordering value.")
    add_page_parser.add_argument("--force", action="store_true", help="Overwrite the page if it already exists.")
    add_page_parser.set_defaults(func=add_page)

    sync_nav_parser = subparsers.add_parser(
        "sync-nav",
        help="Rebuild navigation.json from the current docs tree and frontmatter.",
    )
    sync_nav_parser.add_argument("--site", required=True, help="Generated docs site directory.")
    sync_nav_parser.set_defaults(func=sync_nav)

    render_template_parser = subparsers.add_parser(
        "render-template",
        help="Print or write a markdown template for a new topic.",
    )
    render_template_parser.add_argument(
        "--template",
        required=True,
        choices=sorted(PAGE_TEMPLATES),
        help="Template type to render.",
    )
    render_template_parser.add_argument("--title", required=True, help="Page title.")
    render_template_parser.add_argument("--description", required=True, help="Page description.")
    render_template_parser.add_argument("--order", type=int, help="Sidebar order.")
    render_template_parser.add_argument("--output", help="Optional file path for the rendered template.")
    render_template_parser.set_defaults(func=render_template_command)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
