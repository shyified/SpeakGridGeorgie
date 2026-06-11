# SpeakGrid AAC

A free, iOS-compatible web app for custom AAC-style speaking buttons.

## Features

- Custom grid size from 1x1 through 8x8
- Editable button labels and spoken text
- Built-in emoji/symbol choices
- Uploaded photo support
- Direct image URL support for internet icons
- Select on first touch or select on release
- Message bar that combines selected phrases
- Speak individual buttons or the full message
- Saves your board locally in the browser with localStorage
- Works as a simple static website; no paid server or database required

## How to run locally

Open `index.html` in a browser.

## How to use on iPhone/iPad

1. Put these files on a static web host such as GitHub Pages, Netlify, Vercel, or AWS Amplify.
2. Open the hosted URL in Safari on iPhone/iPad.
3. Tap Share.
4. Tap Add to Home Screen.
5. Launch SpeakGrid from the Home Screen.

## Notes

This app uses the browser's built-in Web Speech API. On iOS, speech must be triggered by a direct user tap/touch, which is why the speaking buttons work best as direct interactions. Voice options depend on the device and browser.

Uploaded photos are stored locally in the browser. Large photos can make local storage fill up quickly, so crop/compress images first if needed.

This is not a medical device and is not a replacement for a commercial AAC system when dependable communication access is medically or educationally required.


## Update notes

- Board settings are hidden until **Edit board** is selected.
- In normal communication mode, touch-drag scrolling over the board is disabled so buttons behave more like an AAC grid.
- In Edit mode, scrolling is re-enabled so the user can reach editing controls and larger boards.
