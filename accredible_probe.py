#!/usr/bin/env python3
"""
accredible_probe.py

Standalone script to test the Accredible -> Badge Publisher connector logic
directly against your Accredible account, with NO dependency on Badge
Publisher's UI, login, or proxy route. Talks straight to Accredible's API.

Mirrors the logic in the accredible-badge-source branch:
  - src/lib/stores/badgeSourceStore.ts  (fetchAccredibleGroups)
  - src/lib/utils/accredible.ts         (badgeclassFromAccredibleGroup)

Usage:
    python3 accredible_probe.py --api-key YOUR_KEY --env sandbox
    (or set ACCREDIBLE_API_KEY as an environment variable instead of --api-key)

Standard library only -- no pip install needed. Works with Python 3.8+.

What it does:
  1. Pages through /v1/issuer/all_groups, same endpoint/pagination/auth header
     Accredible's own export script uses.
  2. Prints the RAW first-page JSON response so you can see the actual
     envelope key (groups vs all_groups vs bare array) and check whether an
     image URL is already present on the group payload under any field name.
  3. Applies the same transform badgeclassFromAccredibleGroup() does: builds
     an Achievement-shaped record per group, and DROPS any alignment/skill
     entry that doesn't have a resolvable targetUrl (since Badge Publisher's
     importer requires targetUrl on every alignment entry).
  4. Prints a summary (groups fetched, alignments kept vs dropped) and writes
     the full transformed array to accredible_achievements_probe.json --
     which you can paste directly into Badge Publisher's "JSON" source type
     as a manual test, independent of the Accredible source-type UI.
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

REGIONS = {
    "us": {
        "api_domain": "https://api.accredible.com",
        "credential_domain": "https://www.credential.net",
    },
    "eu": {
        "api_domain": "https://eu.api.accredible.com",
        "credential_domain": "https://eu.credential.net",
    },
    "sandbox": {
        "api_domain": "https://sandbox.api.accredible.com",
        "credential_domain": "https://sandbox.credential.net",
    },
}


def strip_html(html):
    if not html:
        return ""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", html)).strip()


def narrative_from_earning_criteria(earning, fallback):
    """Mirrors narrativeFromEarningCriteria() in accredible.ts. earning_criteria
    may be a plain string OR a structured list of criterion objects."""
    if not earning:
        return fallback
    if isinstance(earning, str):
        return earning
    if isinstance(earning, list):
        parts = []
        for c in sorted(earning, key=lambda x: (x or {}).get("position", 0)):
            text = strip_html((c or {}).get("text") or "")
            if not text:
                continue
            parts.append(text + (" (optional)" if c.get("required") is False else ""))
        return "\n\n".join(parts) if parts else fallback
    return fallback


def fetch_json(url, api_key, timeout=20):
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Token token={api_key}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, body


def fetch_json_post(url, api_key, payload="{}", timeout=20):
    req = urllib.request.Request(
        url,
        data=payload.encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Token token={api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, body


def extract_groups_list(body_json):
    """Mirrors the defensive envelope-key handling in fetchAccredibleGroups()."""
    if isinstance(body_json, list):
        return body_json, "(bare array)"
    for key in ("groups", "all_groups"):
        if isinstance(body_json.get(key), list):
            return body_json[key], key
    return [], "(none found -- unknown shape, see raw output above)"


def extract_image_from_group(g):
    """Mirrors extractImageFromGroup() in accredible.ts."""
    for path in (("image_url",), ("badge_design", "image_url"), ("design", "image_url")):
        node = g
        for p in path:
            if isinstance(node, dict) and p in node:
                node = node[p]
            else:
                node = None
                break
        if isinstance(node, str) and node:
            return node
    return ""


def image_url_from_design(payload):
    """Mirrors imageUrlFromDesign() in accredible.ts. Tolerates a bare design
    object or one wrapped under a `design` key. `link` comes from the /preview
    endpoint response."""
    root = payload if isinstance(payload, dict) else {}
    d = root.get("design") if isinstance(root.get("design"), dict) else root
    for key in ("rasterized_content_url", "image_url", "preview_url", "link"):
        v = d.get(key)
        if isinstance(v, str) and v:
            return v, key
    return "", None


def badge_design_id_for_group(g):
    """Mirrors badgeDesignIdForGroup() in accredible.ts. A group carries several
    design ids; for a badge prefer badge_design_id, then the primary/default
    design (certificate_design_id last -- it renders a certificate, not a badge)."""
    for key in ("badge_design_id", "primary_design_id", "design_id", "certificate_design_id"):
        v = g.get(key)
        if v is not None and v != "":
            return v
    return None


def fetch_design_images(all_groups, env, api_key, show_raw=True):
    """Resolve a badge image per (badge design id, group name). The design's
    rasterized image is a BLANK template, so we POST /v1/designs/{id}/preview
    with the group's name merged in (`group.course_name`/`group.name`) to get the
    populated badge as `{ link }`, falling back to the blank GET render. Returns
    {"<design_id>|<name>": image_url}. Prints one raw design payload so the exact
    field names can be confirmed against a live account."""
    # design_id -> representative group name (for the raw-dump only)
    combos = []
    seen = set()
    for g in all_groups:
        did = badge_design_id_for_group(g)
        if did is None:
            continue
        name = g.get("course_name") or g.get("name") or ""
        key = f"{did}|{name}"
        if key not in seen:
            seen.add(key)
            combos.append((did, name))

    images = {}
    printed_raw = False
    for did, name in combos:
        img, key = "", None
        # 1) Render the design WITH the group's name merged in.
        try:
            payload = json.dumps({"group.course_name": name, "group.name": name})
            status, body = fetch_json_post(
                f"{env['api_domain']}/v1/designs/{did}/preview", api_key, payload
            )
            img, key = image_url_from_design(json.loads(body))
        except urllib.error.HTTPError as e:
            print(f"  design {did}: preview HTTP {e.code} {e.reason}", file=sys.stderr)
        except Exception as e:
            print(f"  design {did}: preview error {e}", file=sys.stderr)

        # 2) Fallback: blank rasterized design image.
        if not img:
            try:
                status, body = fetch_json(f"{env['api_domain']}/v1/designs/{did}", api_key)
                body_json = json.loads(body)
                if show_raw and not printed_raw:
                    print(f"\n--- RAW design payload (design_id={did}) ---", file=sys.stderr)
                    print(json.dumps(body_json, indent=2)[:4000], file=sys.stderr)
                    print("--- end raw design ---\n", file=sys.stderr)
                    printed_raw = True
                img, key = image_url_from_design(body_json)
            except urllib.error.HTTPError as e:
                print(f"  design {did}: GET HTTP {e.code} {e.reason}", file=sys.stderr)
            except Exception as e:
                print(f"  design {did}: GET error {e}", file=sys.stderr)

        if img:
            images[f"{did}|{name}"] = img
            print(f"  design {did} ('{name}'): image from '{key}' -> {img[:90]}", file=sys.stderr)
        else:
            print(f"  design {did} ('{name}'): no image found (preview or GET)", file=sys.stderr)
    return images


def badgeclass_from_group(g, env, design_images=None):
    name = g.get("course_name") or g.get("name") or ""
    description = strip_html(g.get("course_description") or g.get("description") or "")
    design_images = design_images or {}

    alignment = []
    dropped = []
    for o in g.get("learning_outcomes") or []:
        if isinstance(o, str):
            entry = {"targetName": o}
        else:
            entry = {
                "targetName": o.get("name") or "",
                "targetUrl": o.get("targetUrl"),
                "targetFramework": o.get("targetFramework"),
                "targetCode": o.get("targetCode"),
            }
        if entry.get("targetUrl") and entry.get("targetName"):
            alignment.append({k: v for k, v in entry.items() if v})
        else:
            dropped.append(entry.get("targetName") or "(unnamed)")

    did = badge_design_id_for_group(g)
    image = extract_image_from_group(g)
    if not image and did is not None:
        image = design_images.get(f"{did}|{name}", "")

    fallback_narrative = f"See {env['credential_domain']}/group/{g.get('id')} for details."
    achievement = {
        "id": f"{env['credential_domain']}/group/{g.get('id')}",
        "type": "Achievement",
        "achievementType": g.get("achievement_type") or "Achievement",
        "name": name,
        "description": description,
        "image": image,
        "criteria": {
            "narrative": narrative_from_earning_criteria(
                g.get("earning_criteria"), fallback_narrative
            )
        },
        "alignment": alignment,
    }
    return achievement, dropped


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-key", default=os.environ.get("ACCREDIBLE_API_KEY"))
    parser.add_argument("--env", choices=["us", "eu", "sandbox"], default="sandbox")
    parser.add_argument("--base-url", help="Override API base URL (for testing).")
    parser.add_argument("--page-size", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=200)
    parser.add_argument(
        "-o", "--output", default="accredible_achievements_probe.json",
        help="Where to write the transformed Achievement array.",
    )
    parser.add_argument(
        "--show-raw-pages", type=int, default=1,
        help="How many raw pages to print in full (default 1). Use 0 to skip.",
    )
    args = parser.parse_args()

    if not args.api_key:
        print("ERROR: provide --api-key or set ACCREDIBLE_API_KEY", file=sys.stderr)
        sys.exit(2)

    env = dict(REGIONS[args.env])
    if args.base_url:
        env["api_domain"] = args.base_url.rstrip("/")

    print(f"== Fetching groups from {env['api_domain']} (env={args.env}) ==", file=sys.stderr)

    all_groups = []
    page = 1
    envelope_key_seen = None
    while page <= args.max_pages:
        url = f"{env['api_domain']}/v1/issuer/all_groups?page={page}&page_size={args.page_size}"
        try:
            status, body = fetch_json(url, args.api_key)
        except urllib.error.HTTPError as e:
            print(f"HTTP error on page {page}: {e.code} {e.reason}", file=sys.stderr)
            try:
                print(e.read().decode("utf-8")[:2000], file=sys.stderr)
            except Exception:
                pass
            sys.exit(1)
        except urllib.error.URLError as e:
            print(f"Network error on page {page}: {e}", file=sys.stderr)
            sys.exit(1)

        try:
            body_json = json.loads(body)
        except json.JSONDecodeError:
            print(f"Page {page} did not return valid JSON. Raw response:", file=sys.stderr)
            print(body[:2000], file=sys.stderr)
            sys.exit(1)

        if page <= args.show_raw_pages:
            print(f"\n--- RAW response, page {page} ---", file=sys.stderr)
            print(json.dumps(body_json, indent=2)[:4000], file=sys.stderr)
            print("--- end raw response ---\n", file=sys.stderr)

        page_groups, envelope_key = extract_groups_list(body_json)
        envelope_key_seen = envelope_key
        all_groups.extend(page_groups)

        print(f"page {page}: {len(page_groups)} groups (envelope key: {envelope_key})", file=sys.stderr)

        if len(page_groups) < args.page_size:
            break
        page += 1

    print(f"\n== Total groups fetched: {len(all_groups)} (envelope key: {envelope_key_seen}) ==", file=sys.stderr)

    # Resolve badge images from each group's Design (GET /v1/designs/{design_id}).
    print("\n== Resolving badge images from Designs ==", file=sys.stderr)
    design_images = fetch_design_images(
        all_groups, env, args.api_key, show_raw=args.show_raw_pages > 0
    )

    achievements = []
    total_alignment_kept = 0
    total_alignment_dropped = 0
    groups_with_image = 0
    for g in all_groups:
        achievement, dropped = badgeclass_from_group(g, env, design_images)
        achievements.append(achievement)
        total_alignment_kept += len(achievement["alignment"])
        total_alignment_dropped += len(dropped)
        if achievement["image"]:
            groups_with_image += 1

    print(f"Alignment entries kept (have targetUrl): {total_alignment_kept}", file=sys.stderr)
    print(f"Alignment entries dropped (no targetUrl): {total_alignment_dropped}", file=sys.stderr)
    print(f"Groups with a resolved image URL: {groups_with_image} / {len(all_groups)}", file=sys.stderr)
    print(
        "  (If an image URL is present, open it in a browser to confirm it "
        "resolves publicly -- CTDL requires a publicly reachable image.)",
        file=sys.stderr,
    )

    if achievements:
        print("\n--- Sample transformed achievement (first one) ---", file=sys.stderr)
        print(json.dumps(achievements[0], indent=2), file=sys.stderr)
        print("--- end sample ---\n", file=sys.stderr)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(achievements, f, indent=2)
    print(f"Wrote {len(achievements)} transformed achievements to {args.output}", file=sys.stderr)
    print("You can paste that file's contents into Badge Publisher's 'JSON' source type directly.", file=sys.stderr)


if __name__ == "__main__":
    main()