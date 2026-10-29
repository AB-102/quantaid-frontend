// The header's Chat button grows into the chat panel, and the panel shrinks back into it (Material Design's
// "container transform"). The panel starts clipped to the button's rectangle, in the button's colour and showing
// a copy of the button (its "face"), so it covers the real button seamlessly. It then flows to the panel's
// top-right corner and pours down and to the left (the chat-spill-open/-close keyframes in index.css). Closing
// gathers it back, and the panel hides only once it's an exact copy of the button again.
//
//                 opening (300ms)                          closing (250ms)
//   panel         to the corner by 120ms, full by 300ms    to the corner by 150ms, the button by 250ms, hidden
//   recolours     button → panel colour, 0-300ms           panel → button colour, 0-250ms
//   button face   fades out          0-90ms                fades in            175-250ms
//   chat content  fades in           120-300ms             fades out           0-75ms

export const MORPH_EASING = 'cubic-bezier(0.2, 0, 0, 1)'; // Material 3 "emphasized", for the colour change
export const MORPH_OPEN_MS = 300;
export const MORPH_CLOSE_MS = 250;
export const FACE_FADE_OUT_MS = 90;
export const FACE_FADE_IN_MS = 75;
export const CONTENT_FADE_IN_DELAY_MS = 120;
export const CONTENT_FADE_OUT_MS = 75;

// The panel's surface is the button's colour while it's (nearly) closed, and its own once open
export const BUTTON_COLOR = '#032242'; // bg-brand-search
export const PANEL_COLOR = '#181F31'; // bg-brand-dark-panel
