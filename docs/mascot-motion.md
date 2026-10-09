# Mascot eye motion

The original approved hero remains unchanged: body, pose, shoes, takeaway box and Batumi backdrop are static. The rejected bite/beer sprite story, extra backdrop, cart reaction, smoke and tap-to-play controls have been removed.

Only two small inline SVG eye apertures animate. Their coordinates match the 2172 × 724 original hero. Shaded whites, brown irises and highlights are clipped inside the existing eyelids. A 16-second CSS transform loop makes occasional gentle left/right glances; the existing closed-eye artwork supplies brief blinks, including one double blink. Both layers share the original hero geometry on desktop and mobile.

There are no frame timers, canvas, video, WebGL, animation libraries or extra downloaded artwork. The original hero-open.webp and hero-blink.webp remain the only image assets. React only observes viewport visibility, tab visibility and reduced-motion preference, and handles the pause button. Animations pause when not visible. Motion-off/reduced-motion use the original still illustration.
