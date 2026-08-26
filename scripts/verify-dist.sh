#!/usr/bin/env bash
# Diffs rendered HTML against dist-baseline/, normalizing content-derived asset
# hashes so an unchanged page compares equal.
#
# Astro minifies each page onto a single very long line, so a line-granular
# `diff -u` is unreadable. This reports CHARACTER-level changes instead: one
# line per edit, showing exactly what text was replaced. Exit 1 when any page
# differs — read the edits and confirm each is an accepted diff for the task
# you are verifying.
set -uo pipefail

python3 - "$@" <<'PY'
import re, difflib, pathlib, sys

NORM = (r'_astro/([A-Za-z0-9_.-]+)\.[A-Za-z0-9_-]{8}\.(css|js)', r'_astro/\1.HASH.\2')
BASE, NEW = pathlib.Path('dist-baseline/client'), pathlib.Path('dist/client')
CLIP = 160

def norm(p):
    return re.sub(NORM[0], NORM[1], p.read_text())

def clip(s):
    return s if len(s) <= CLIP else f'{s[:CLIP]}… (+{len(s)-CLIP} chars)'

status = 0
old_pages = sorted(p.relative_to(BASE) for p in BASE.rglob('*.html'))
new_pages = sorted(p.relative_to(NEW) for p in NEW.rglob('*.html'))

for rel in old_pages:
    new = NEW / rel
    if not new.exists():
        print(f'MISSING in new build: {rel}'); status = 1; continue
    a, b = norm(BASE / rel), norm(new)
    ops = [o for o in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
           if o[0] != 'equal']
    if not ops:
        continue
    status = 1
    print(f'\n=== {rel} — {len(ops)} change(s) ===')
    for tag, i1, i2, j1, j2 in ops:
        print(f'  {tag}: {clip(a[i1:i2])!r}')
        print(f'       -> {clip(b[j1:j2])!r}')

for rel in new_pages:
    if not (BASE / rel).exists():
        print(f'NEW page: {rel}'); status = 1

if status == 0:
    print('dist HTML identical to baseline')
sys.exit(status)
PY
