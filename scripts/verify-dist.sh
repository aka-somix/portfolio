#!/usr/bin/env bash
# Diffs rendered HTML against dist-baseline/, normalizing content-derived
# asset hashes so an unchanged page compares equal.
set -uo pipefail

norm() {
  sed -E \
    -e 's/_astro\/([A-Za-z0-9_.-]+)\.[A-Za-z0-9_-]{8}\.(css|js)/_astro\/\1.HASH.\2/g' \
    "$1"
}

status=0
for base in $(cd dist-baseline/client && find . -name '*.html' | sort); do
  new="dist/client/${base#./}"
  old="dist-baseline/client/${base#./}"
  if [ ! -f "$new" ]; then
    echo "MISSING in new build: $base"; status=1; continue
  fi
  if ! diff -u <(norm "$old") <(norm "$new") > /tmp/vd.diff; then
    echo "=== DIFF: $base ==="; cat /tmp/vd.diff; status=1
  fi
done

for new in $(cd dist/client && find . -name '*.html' | sort); do
  [ -f "dist-baseline/client/${new#./}" ] || { echo "NEW page: $new"; status=1; }
done

[ $status -eq 0 ] && echo "dist HTML identical to baseline"
exit $status
