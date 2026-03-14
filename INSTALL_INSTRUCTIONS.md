# FCWatch Overhaul - iOS Bookmarklet Installation

## Quick Install (Recommended)

1. Open Safari on your iPhone/iPad
2. Navigate to any website and bookmark it
3. Edit the bookmark:
   - Tap the bookmarks icon (📖)
   - Tap "Edit"
   - Select the bookmark you just created
   - Change the NAME to: **FCWatch Overhaul**
   - Replace the URL with the contents of `BOOKMARKLET_LOADER.txt`
4. Save the bookmark

## How to Use

1. Navigate to **fc-watch.com** in Safari
2. Tap the bookmarks icon (📖)
3. Tap **FCWatch Overhaul**
4. The extension will load and apply all visual enhancements!

## Notes
- You must tap the bookmarklet each time you visit fc-watch.com
- Settings are saved in localStorage and persist between visits
- The bookmarklet fetches the latest version each time it runs

## Self-Hosting (Advanced)
If you want to host the bundle yourself:
1. Run `node build_bookmarklet.js` to generate `dist/fcwatch_bookmarklet.js`
2. Host `fcwatch_bookmarklet.js` on any web server / GitHub Pages
3. Update the URL in `BOOKMARKLET_LOADER.txt` to point to your hosted copy
