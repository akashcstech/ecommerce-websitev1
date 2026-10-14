"""GET /api/main-txt — builds main.txt live from the real project source files.

Format (strict):
  ROOT FOLDER STRUCTURE (root/ tree)
  then for every file:
    - FILE NAME: <path>
    - COPYPASTE
    <file content>
    - CODE -END
"""

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter(tags=["export"])

ROOT = Path(__file__).resolve().parents[2]  # /app
MAIN_TXT = ROOT / "main.txt"

# Source written for this app (preinstalled shadcn UI kit, lockfiles and tool config excluded).
INCLUDE_GLOBS = [
    "backend/server.py",
    "backend/seed.py",
    "backend/requirements.txt",
    "backend/.env.example",
    "backend/lib/*.py",
    "backend/models/*.py",
    "backend/routers/*.py",
    "frontend/index.html",
    "frontend/src/**/*.ts",
    "frontend/src/**/*.tsx",
    "frontend/src/**/*.css",
]
EXCLUDE_PARTS = {"__pycache__", "node_modules", "ui"}
EXCLUDE_FILES = {"frontend/src/lib/recharts.tsx", "frontend/src/lib/lucide-react.tsx", "frontend/src/vite-env.d.ts"}


def collect_files() -> list[str]:
    files: set[str] = set()
    for pattern in INCLUDE_GLOBS:
        for p in ROOT.glob(pattern):
            rel = p.relative_to(ROOT).as_posix()
            if p.is_file() and not (EXCLUDE_PARTS & set(p.relative_to(ROOT).parts)) and rel not in EXCLUDE_FILES:
                files.add(rel)
    # backend first, then frontend; folders before their nested folders' files read naturally
    return sorted(files, key=lambda f: (f.split("/")[0] != "backend", f.count("/"), f))


def build_tree(files: list[str]) -> str:
    tree: dict = {}
    for f in files:
        node = tree
        for part in f.split("/"):
            node = node.setdefault(part, {})
    lines = ["root/"]

    def walk(node: dict, prefix: str) -> None:
        entries = sorted(node.items(), key=lambda kv: (not kv[1], kv[0]))  # folders first
        for i, (name, child) in enumerate(entries):
            last = i == len(entries) - 1
            lines.append(f"{prefix}{'└── ' if last else '├── '}{name}{'/' if child else ''}")
            if child:
                walk(child, prefix + ("    " if last else "│   "))

    walk(tree, "")
    return "\n".join(lines)


def build_main_txt() -> str:
    files = collect_files()
    out = [
        "MAIN.TXT - Online Shopping Website (Bazaarline) - full source export",
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"Total files: {len(files)}",
        "",
        "1) ROOT FOLDER STRUCTURE",
        "",
        build_tree(files),
        "",
        "2) FILES",
        "",
    ]
    for rel in files:
        content = (ROOT / rel).read_text(encoding="utf-8", errors="replace").rstrip("\n")
        out += [f"- FILE NAME: root/{rel}", "- COPYPASTE", content, "- CODE -END", ""]
    out.append("- END OF main.txt")
    return "\n".join(out) + "\n"


@router.get("/main-txt", response_class=PlainTextResponse)
async def download_main_txt():
    text = build_main_txt()
    MAIN_TXT.write_text(text, encoding="utf-8")  # keep /app/main.txt on disk in sync too
    return PlainTextResponse(
        text,
        headers={"Content-Disposition": 'attachment; filename="main.txt"', "Cache-Control": "no-store"},
    )
