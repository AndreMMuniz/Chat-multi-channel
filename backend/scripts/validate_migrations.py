#!/usr/bin/env python3
"""Validate Alembic migration chain integrity and optionally run against a database.

Usage
-----
# Chain-only check (no DB required — safe for CI):
    python scripts/validate_migrations.py

# Full upgrade against a real DB:
    DATABASE_URL=postgresql://... python scripts/validate_migrations.py --run-upgrade

# Full upgrade + rollback test:
    DATABASE_URL=postgresql://... python scripts/validate_migrations.py --run-upgrade --test-downgrade
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

# ── Expected linear chain ─────────────────────────────────────────────────────
# Each tuple: (revision_id, expected_down_revision)
EXPECTED_CHAIN = [
    ("de45c95bc364", None),
    ("bf57d943ecd0", "de45c95bc364"),
    ("c9f2e1d3a8b5", "bf57d943ecd0"),
    ("d7e3f9a1b2c4", "c9f2e1d3a8b5"),
    ("e8f4a2c6d9b1", "d7e3f9a1b2c4"),
    ("f1a2b3c4d5e6", "e8f4a2c6d9b1"),
    ("g2b3c4d5e6f7", "f1a2b3c4d5e6"),
    ("h3c4d5e6f7a8", "g2b3c4d5e6f7"),
    ("i4d5e6f7a8b9", "h3c4d5e6f7a8"),
]

BACKEND_DIR = Path(__file__).parent.parent


def _section(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def check_chain() -> bool:
    """Parse migration files and verify down_revision chain matches expected."""
    import importlib.util

    versions_dir = BACKEND_DIR / "alembic" / "versions"
    actual: dict[str, str | None] = {}

    for path in sorted(versions_dir.glob("*.py")):
        if path.name.startswith("__"):
            continue
        spec = importlib.util.spec_from_file_location(path.stem, path)
        mod = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(mod)
        except Exception as exc:
            print(f"  ERROR loading {path.name}: {exc}")
            return False
        rev = getattr(mod, "revision", None)
        down = getattr(mod, "down_revision", None)
        if rev:
            actual[rev] = down

    errors: list[str] = []

    for rev, expected_down in EXPECTED_CHAIN:
        if rev not in actual:
            errors.append(f"  MISSING revision: {rev}")
        elif actual[rev] != expected_down:
            errors.append(
                f"  CHAIN ERROR {rev}: expected down_revision={expected_down!r}, "
                f"got {actual[rev]!r}"
            )

    extra = set(actual.keys()) - {r for r, _ in EXPECTED_CHAIN}
    if extra:
        errors.append(
            f"  UNEXPECTED revisions (not in expected chain): {sorted(extra)}\n"
            f"  → Update EXPECTED_CHAIN in this script if the migration was intentional."
        )

    if errors:
        for e in errors:
            print(e)
        return False

    print(f"  PASS Chain is valid - {len(EXPECTED_CHAIN)} migrations, linear, no gaps")
    return True


def run_alembic(args: list[str]) -> bool:
    """Run an alembic command from the backend directory."""
    result = subprocess.run(
        ["alembic"] + args,
        cwd=str(BACKEND_DIR),
        capture_output=False,
        text=True,
    )
    return result.returncode == 0


def check_current_revision() -> str | None:
    """Return the current head revision in the DB, or None on error."""
    result = subprocess.run(
        ["alembic", "current"],
        cwd=str(BACKEND_DIR),
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        # Extract revision from output like: "i4d5e6f7a8b9 (head)"
        for line in result.stdout.splitlines():
            line = line.strip()
            if line and not line.startswith("INFO"):
                return line
    return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate Alembic migration chain",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--run-upgrade",
        action="store_true",
        help="Run 'alembic upgrade head' against DATABASE_URL",
    )
    parser.add_argument(
        "--test-downgrade",
        action="store_true",
        help="Also run 'alembic downgrade -1' after upgrade (requires --run-upgrade)",
    )
    args = parser.parse_args()

    # ── Step 1: Chain integrity ───────────────────────────────────────────────
    _section("Step 1: Migration Chain Integrity")
    sys.path.insert(0, str(BACKEND_DIR))

    if not check_chain():
        print("\nFAIL Chain integrity check FAILED — fix errors above before proceeding.")
        sys.exit(1)

    if not args.run_upgrade:
        _section("Result")
        print("  PASS Chain-only check passed (no DB required)")
        print(
            "\n  To run against a real database:\n"
            "  DATABASE_URL=postgresql://... python scripts/validate_migrations.py --run-upgrade"
        )
        sys.exit(0)

    # ── Step 2: DB upgrade ────────────────────────────────────────────────────
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        print("\nFAIL DATABASE_URL is not set — cannot run upgrade.")
        sys.exit(1)

    _section("Step 2: alembic upgrade head")
    print(f"  Target: {db_url[:50]}...")
    if not run_alembic(["upgrade", "head"]):
        print("\nFAIL 'alembic upgrade head' FAILED")
        sys.exit(1)

    print("\n  PASS upgrade head completed")

    # ── Step 3: Verify current revision ──────────────────────────────────────
    _section("Step 3: Verify current revision")
    current = check_current_revision()
    expected_head = EXPECTED_CHAIN[-1][0]
    if current and expected_head in current:
        print(f"  PASS DB is at head: {current}")
    else:
        print(f"  WARN  Current revision: {current} (expected head: {expected_head})")

    # ── Step 4 (optional): Downgrade test ────────────────────────────────────
    if args.test_downgrade:
        _section("Step 4: alembic downgrade -1 (rollback test)")
        if not run_alembic(["downgrade", "-1"]):
            print("\nFAIL 'alembic downgrade -1' FAILED")
            sys.exit(1)
        print("\n  PASS downgrade -1 completed")

        _section("Step 4b: Re-applying upgrade head after rollback test")
        if not run_alembic(["upgrade", "head"]):
            print("\nFAIL Re-apply 'alembic upgrade head' FAILED")
            sys.exit(1)
        print("\n  PASS Re-apply completed — DB restored to head")

    _section("Final Result")
    print("  PASS All validation steps passed")
    print(f"  Migrations validated: {len(EXPECTED_CHAIN)}")
    if args.test_downgrade:
        print("  Downgrade -1 tested and restored")


if __name__ == "__main__":
    main()
