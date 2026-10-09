# Mascot motion assets

Created with the built-in image generation tool from the approved mascot and hero. Original pose atlas retained; all character poses and backdrop are stored in public/mascot. Frame bounds and shoe anchors align the poses at a constant scale. An SVG alpha-transfer filter in the browser suppresses low-alpha generation flecks without modifying the source artwork. Both outputs are encoded as WebP.

The 16-pose sequence is a lightweight storyboard-style animation; it is not a continuous 3D performance. Frame transitions remain discrete. Browser smoke/reaction decoration uses transform and opacity.

## Atlas prompt

Use case: identity-preserve / stylized-concept.
Asset type: a genuinely TRANSPARENT RGBA animation SPRITE ATLAS for a website.
References: image 1 is the definitive mascot identity, same smirking half-lidded ivory khinkali humanoid in elegant red-and-cream sneakers, white gloves, seated crossed legs, red takeaway box on viewer's RIGHT. Image 2 only reinforces character lighting and perspective. Do NOT include any scenery from either reference.
Output: ONE square 2048x2048 image, EXACT uniform 4 columns × 4 rows grid, 16 equal 512x512 cells. NO visible grid, NO text or labels. Genuine transparent background, NOT white, NOT painted checkerboard. Each cell contains one full character head-to-toe plus red box; all confined within their own cell leaving 28px margin. Every cell uses IDENTICAL camera, fixed character size, identical seated body and crossed-leg anchor, top of head at local y40, shoes bottom at y472, fixed box position to viewer-right near y290. ABSOLUTELY NO cropping, no extra limbs, no overlaps between cells. Body is pale ivory dough, never red. Whole character has exactly two arms and two legs. The seat and background are completely transparent: character sits on an invisible ledge; include NO wall, NO floor, NO scenery, NO frame-wide shadows.
16 animation KEYFRAMES in ROW-MAJOR reading order left-to-right then top-to-bottom. Body stays seated crossed legs, mostly still; action is performed by arm nearest box, other gloved hand rests as in reference, facial expressions subtle. Red box remains SAME position every frame and lid changes hinge angle naturally. Small ordinary food khinkali has no face. Beer mug small clear glass with golden beer and white foam, stored behind box until used.
Frame 0: relaxed idle reference pose, closed box, sly look toward viewer.
Frame 1: looks toward box and opens red lid.
Frame 2: reaches gloved hand into open box.
Frame 3: lifts one tiny ordinary edible khinkali from box.
Frame 4: holds khinkali near mouth, purses lips to blow on it.
Frame 5: brings khinkali to mouth and takes a bite.
Frame 6: chews happily, remaining half-khinkali near mouth.
Frame 7: swallowed, empty hand lowers, satisfied eyes; box lid resting down.
Frame 8: reaches for small glass beer mug just behind box.
Frame 9: raises mug halfway toward mouth.
Frame 10: tips mug at mouth, takes one sip.
Frame 11: lowers mug, tiny white foam moustache over upper lip.
Frame 12: resting hand wipes foam moustache while other hand holds mug low; still exactly two arms.
Frame 13: returns mug behind box and closes box.
Frame 14: turns face toward viewer with grin and gloved thumbs-up.
Frame 15: returns EXACTLY to frame 0 pose, closed box, sly half-lidded smile.
Premium polished 3D animated-film mascot rendering, soft warm sunlight from upper-left matching reference, coherent anatomy and materials. Sprite mechanics are critical: same scale, same body location in each equal cell, same crossed legs, no perspective changes. Only arms, eyelids, mouth and held props change. Keep silhouette crisp on transparent alpha. No typography, logos, bubbles, numbered frames, dividers or backgrounds.


## Backdrop prompt

Use case: precise-object-edit. Asset type: clean background plate for a website mascot animation. Input image 1 is the exact edit target. Keep the SAME exact very wide 3:1 composition and framing. Remove ONLY the ivory khinkali mascot sitting on the right, its white gloves, arms, legs and red/white sneakers, and its ENTIRE red-and-cream takeaway box beside it, plus their shadows. Reconstruct the clean warm pale stone parapet/ledge behind them with matching texture, edge geometry and lighting. Continue the already-visible water/coast/sky naturally behind the removed head and body. Preserve all other objects and their exact size, location, framing, colors and lighting: the huge khinkali plate, all khinkali dumplings and sauce bowl in the foreground LEFT, herbs and vegetation, turquoise sparkling sea, blue sky and white clouds, coastal skyline and mountains, Batumi Alphabet Tower, Ferris wheel and Ali and Nino sculpture. Keep the full original image extent, do not crop or zoom, do not relocate anything, do not redraw/reinvent the composition. Right side must now be an empty clean stone ledge with the unchanged distant backdrop, ready to receive a separate transparent mascot. No new objects, no extra characters, no lettering or logos, no labels or watermarks. Opaque background. Output wide 3:1 matching reference.
