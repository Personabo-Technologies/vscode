# Build the iconset for macOS
mkdir easycode-ai.iconset
sips -z 16 16   easycode-ai.png --out easycode-ai.iconset/icon_16x16.png
sips -z 32 32   easycode-ai.png --out easycode-ai.iconset/icon_16x16@2x.png
sips -z 32 32   easycode-ai.png --out easycode-ai.iconset/icon_32x32.png
sips -z 64 64   easycode-ai.png --out easycode-ai.iconset/icon_32x32@2x.png
sips -z 128 128 easycode-ai.png --out easycode-ai.iconset/icon_128x128.png
sips -z 256 256 easycode-ai.png --out easycode-ai.iconset/icon_128x128@2x.png
sips -z 256 256 easycode-ai.png --out easycode-ai.iconset/icon_256x256.png
sips -z 512 512 easycode-ai.png --out easycode-ai.iconset/icon_256x256@2x.png
sips -z 512 512 easycode-ai.png --out easycode-ai.iconset/icon_512x512.png
cp easycode-ai.png easycode-ai.iconset/icon_512x512@2x.png
iconutil -c icns easycode-ai.iconset
rm -R easycode-ai.iconset
cp easycode-ai.png ../resources/darwin/easycode-ai.png
cp easycode-ai.icns ../resources/darwin/easycode-ai.icns

# Copy the product icon to the resources/linux folder.
cp easycode-ai.png ../resources/linux/easycode-ai.png

# Copy the product icon to the resources/win32 folder.
sips -z 70 70   easycode-ai.png --out ../resources/win32/easycode-ai_70x70.png
sips -z 150 150 easycode-ai.png --out ../resources/win32/easycode-ai_150x150.png

# Copy the product icon to the resources/server folder.
sips -z 192 192 easycode-ai.png --out ../resources/server/easycode-ai-192.png
sips -z 512 512 easycode-ai.png --out ../resources/server/easycode-ai-512.png

# In order to convert the product icon for the Windows Inno Setup installer
# UI, we need to resize the image, then pad it, and finally convert it to BMP
# format in several steps. The following functions are used to achieve this.
constrain_image() {
	local max=$1
	local input=$2
	local output=$3
	sips -Z "$max" -s dpiHeight 96 -s dpiWidth 96 --padColor FFFFFF "$input" --out "$output"
}

pad_image() {
	local height=$1
	local width=$2
	local input=$3
	local output=$4
	sips -p "$height" "$width" --padColor FFFFFF "$input" --out "$output"
}

to_bmp() {
	local input=$1
	local output=$2
	sips -s format bmp "$input" --out "$output"
}

convert_png_to_bmp() {
	local max=$1
	local height=$2
	local width=$3
	local input=$4
	local output_base=$5
	local output_png="${output_base}.png"
	local output_bmp="${output_base}.bmp"
	constrain_image "$max" "$input" "$output_png"
	pad_image "$height" "$width" "$output_png" "$output_png"
	to_bmp "$output_png" "$output_bmp"
	rm -f "$output_png"
}

convert_png_to_bmp 164 314 164 easycode-ai.png ../resources/win32/easycode-ai-inno-big-100
convert_png_to_bmp 192 386 192 easycode-ai.png ../resources/win32/easycode-ai-inno-big-125
convert_png_to_bmp 246 459 246 easycode-ai.png ../resources/win32/easycode-ai-inno-big-150
convert_png_to_bmp 273 556 273 easycode-ai.png ../resources/win32/easycode-ai-inno-big-175
convert_png_to_bmp 328 604 328 easycode-ai.png ../resources/win32/easycode-ai-inno-big-200
convert_png_to_bmp 355 700 355 easycode-ai.png ../resources/win32/easycode-ai-inno-big-225
convert_png_to_bmp 410 797 410 easycode-ai.png ../resources/win32/easycode-ai-inno-big-250

convert_png_to_bmp  55  55  55 easycode-ai.png ../resources/win32/easycode-ai-inno-small-100
convert_png_to_bmp  64  68  64 easycode-ai.png ../resources/win32/easycode-ai-inno-small-125
convert_png_to_bmp  80  83  80 easycode-ai.png ../resources/win32/easycode-ai-inno-small-150
convert_png_to_bmp  92  97  92 easycode-ai.png ../resources/win32/easycode-ai-inno-small-175
convert_png_to_bmp 106 106 110 easycode-ai.png ../resources/win32/easycode-ai-inno-small-200
convert_png_to_bmp 119 123 119 easycode-ai.png ../resources/win32/easycode-ai-inno-small-225
convert_png_to_bmp 138 140 138 easycode-ai.png ../resources/win32/easycode-ai-inno-small-250
