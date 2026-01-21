#!/bin/bash

# Generate animated GIF from SVG frames
# Requires: ffmpeg (brew install ffmpeg)
# Optional: librsvg for better SVG rendering (brew install librsvg)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Converting SVG frames to PNG..."

# Convert SVGs to PNGs using rsvg-convert (better quality) or fallback to ffmpeg
if command -v rsvg-convert &> /dev/null; then
    for i in 1 2 3; do
        rsvg-convert -w 800 -h 200 "$SCRIPT_DIR/import-frame-$i.svg" > "$SCRIPT_DIR/frame-$i.png"
        echo "  Converted frame $i"
    done
else
    echo "  Note: Install librsvg for better quality (brew install librsvg)"
    echo "  Using ImageMagick/ffmpeg fallback..."
    for i in 1 2 3; do
        if command -v convert &> /dev/null; then
            convert -background none -density 150 "$SCRIPT_DIR/import-frame-$i.svg" "$SCRIPT_DIR/frame-$i.png"
        else
            ffmpeg -y -i "$SCRIPT_DIR/import-frame-$i.svg" "$SCRIPT_DIR/frame-$i.png" 2>/dev/null
        fi
        echo "  Converted frame $i"
    done
fi

echo "Creating animated GIF..."

# Create GIF with 1 second per frame, looping forever
ffmpeg -y \
    -framerate 1 \
    -i "$SCRIPT_DIR/frame-%d.png" \
    -vf "fps=1,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer" \
    -loop 0 \
    "$OUTPUT_DIR/import-animation.gif"

echo "Cleaning up temporary PNGs..."
rm -f "$SCRIPT_DIR"/frame-*.png

echo ""
echo "Done! GIF created at: $OUTPUT_DIR/import-animation.gif"
