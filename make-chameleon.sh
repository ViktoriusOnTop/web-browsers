#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$(readlink -f "$0")")"
ROOT="$(pwd)"

read -r -p "this will take about 45 mins and use a lot of RAM and CPU. Do you want to continue? [y/N] " response

if [[ "${response,,}" =~ ^(y|ye|yes)$ ]]; then
    echo "Starting process..."
else
    echo "Aborted."
    exit 1
fi

if [[ "$ROOT" == *" "* ]]; then
  echo "'$ROOT' contains a space... remove it at once." >&2
  echo "run cd .. && mv \"$ROOT\" \"${ROOT// /\-}\" && cd \"${ROOT// /\-}\"" >&2
  exit 1
fi

for tool in node pnpm rustc cargo; do
  command -v "$tool" >/dev/null || { echo "make-chameleon.sh: missing $tool on PATH :(" >&2; exit 1; }
done

[ -d chameleon/firefox ] || echo ">> firefox/ missing, i'll clone it but it'll cost you"

pyver="$(python3 -c 'import sys; print(sys.version_info[0] * 100 + sys.version_info[1])')"
if [ "$pyver" -gt 312 ]; then
  for candidate in python3.12 python3.11; do
    if command -v "$candidate" >/dev/null; then
      shim="$(mktemp -d)"
      ln -sf "$(command -v "$candidate")" "$shim/python3"
      export PATH="$shim:$PATH"
      trap 'rm -rf "$shim"' EXIT
      echo ">> python3 is $(python3 -V 2>&1 | cut -d' ' -f2), which mach does not support. using $candidate but it might not work"
      break
    fi
  done
fi

make -C chameleon web

read -r -p "do you wanna run it? [Y/n] " response

if [[ "${response,,}" =~ ^(|y|ye|yes)$ ]]; then
    echo "Running..."
    exec ./run-chameleon.sh
else
    echo "donesies"
    exit 1
fi