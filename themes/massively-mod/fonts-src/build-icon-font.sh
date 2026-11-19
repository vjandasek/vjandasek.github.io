#!/usr/bin/env bash
# Rebuilds static/assets/fonts/fa-icons.woff2: Font Awesome Free, cut down to the
# icons the site uses and merged into one small font (family "FontAwesome").
#
# Needs npm and fonttools with brotli (pip install --user fonttools brotli).
# Run from anywhere:  themes/massively-mod/fonts-src/build-icon-font.sh
#
# To add an icon: look up its code point at https://fontawesome.com/icons
# (Free, Brands or Solid), add it to the matching list below, add a rule to
# assets/scss/components/_icon.scss, and run this again.
set -euo pipefail

FA_VERSION=7.3.1

# Brands: twitter, facebook-f, instagram, linkedin-in, github, youtube,
# google-plus-g, lastfm, flickr. (FA4's fa-facebook maps to facebook-f.)
BRANDS=U+F099,U+F39E,U+F16D,U+F0E1,U+F09B,U+F167,U+F0D5,U+F202,U+F16E
# Solid: check, angle-left, angle-right, bars, xmark (used by code point in the SCSS).
SOLID=U+F00C,U+F104,U+F105,U+F0C9,U+F00D

theme=$(cd "$(dirname "$0")/.." && pwd)
out="$theme/static/assets/fonts"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

(cd "$work" && npm pack --silent "@fortawesome/fontawesome-free@$FA_VERSION" >/dev/null \
  && mkdir pkg && tar xzf fortawesome-fontawesome-free-*.tgz -C pkg)
fonts="$work/pkg/package/webfonts"

opts=(--layout-features='' --no-hinting --name-IDs='*')
pyftsubset "$fonts/fa-brands-400.woff2" --unicodes="$BRANDS" "${opts[@]}" --output-file="$work/brands.ttf"
pyftsubset "$fonts/fa-solid-900.woff2" --unicodes="$SOLID" "${opts[@]}" --output-file="$work/solid.ttf"
pyftmerge "$work/brands.ttf" "$work/solid.ttf" --output-file="$work/merged.ttf"
pyftsubset "$work/merged.ttf" --unicodes='*' "${opts[@]}" --flavor=woff2 --output-file="$out/fa-icons.woff2"
cp "$work/pkg/package/LICENSE.txt" "$out/LICENSE-font-awesome.txt"

echo "Wrote $out/fa-icons.woff2 ($(wc -c <"$out/fa-icons.woff2") bytes) from Font Awesome Free $FA_VERSION"
