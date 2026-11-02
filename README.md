# LeetCode Heatmap Customizer

A Manifest V3 Chrome extension that applies a saved randomized green pattern to the most recent 30 days of a LeetCode profile heatmap, plus light green to 14 randomly selected days in the preceding 30-day period. It changes only client-side SVG styling. It does not submit solutions, call APIs, or change LeetCode data.

## Install

1. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
2. Choose **Load unpacked** and select this project folder (the folder containing `manifest.json`).
3. Open a LeetCode profile at `https://leetcode.com/u/<username>/`, then open the extension popup and turn customization on.

Both patterns are generated once and saved with `chrome.storage.local`. Use **Regenerate pattern** to replace them. **Restore original colors** disables painting for that page and restores the original SVG `fill` attribute and inline fill style. Turn the switch back on to resume. The **Disable heatmap hover** toggle independently blocks pointer interaction with heatmap cells, and can be switched off to restore LeetCode's hover behavior.

The **Custom profile stats** section lets you set the displayed **Total active days** and **Max streak** values. Turn its toggle on to replace those two labels' adjacent values on your profile; turn it off to restore the values LeetCode displays. Values must be whole numbers of 0 or more, and are saved locally.

## Check desktop and responsive layouts

1. Enable the extension on a profile and confirm the recent 30 calendar cells use the randomized green preview and exactly 14 cells in the previous 30-day period use light green.
2. Refresh the profile; the same pattern should remain. Turn the switch off and verify the page's original fills return.
3. Turn it on, regenerate, and confirm the preview and heatmap change together.
4. In Chrome DevTools, toggle the device toolbar and try narrow and wide viewport sizes. Both date ranges should retain their patterns after responsive reflow.
5. Navigate to another `/u/<username>/` profile and verify it is customized; navigate away and back to exercise SPA updates.

## Debug

- Inspect the profile tab with **DevTools → Console**. Errors from the content script are logged with the `Heatmap Customizer` prefix.
- In **Elements**, inspect the final 30 `rect.cursor-pointer` nodes in the visible heatmap; their inline fill is extension-owned while enabled.
- In **Application → Storage → Extension storage**, inspect `enabled`, `pattern`, and `palette`.
- After editing extension files, return to `chrome://extensions`, press the extension's reload button, then refresh the profile tab. Content scripts already injected into a tab are not replaced by reloading the extension.

## Source files

- `manifest.json`: permissions and profile-only content script matches.
- `pattern.js`: green palette, generation, and validation.
- `storage.js`: persistent settings defaults and validation.
- `content.js`: visible heatmap discovery, painting, observation, and restoration.
- `popup.html`, `popup.css`, `popup.js`: popup interface and actions.
