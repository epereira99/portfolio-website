# Road scene prompts

Sprites for the homepage road (`?style=painted` / `?style=cartoon`). Save each result under `art/raw/road/<style>/<name>.png`
and run `npm run gen:road`. Backgrounds must be flat and plain so the script can key them out.

Reference images to upload with the prompts:
- **Walker** (painted style): `art/raw/road/ref-walker.png`
- **Cartoon tree** (cartoon style): `art/raw/road/cartoon/tree.png`
- **Cartoon walker** (for the walk video): the Canva image MAHZ8c2SZTU

## Still needed

### cartoon/cloud.png (reference: cartoon tree, 2:1)
A single fluffy white cumulus cloud in exactly the same cartoon art style as the reference image (the cartoon tree):
smooth glossy cartoon rendering, clean edges, soft gradients, bright colours, flat-ish bottom with soft blue shading
underneath, lit from the upper left. Whole cloud visible, centred, on a plain flat medium sky-blue background (#6fa8dc)
so the cloud edges are clear. No text.

### cartoon/mountains-pt.png (reference: cartoon tree, 2:1)
A wide panoramic strip of distant green rolling mountains and hills in exactly the same cartoon art style as the
reference image (the cartoon tree): smooth glossy cartoon rendering, clean edges, soft gradients, bright saturated teal
and green colours, sunny light from the upper left. Only the mountain range silhouette, isolated on a plain flat pure
white background above it and a flat straight bottom edge. No foreground trees, no people, no buildings, no text.

### cartoon/mountains-se.png (reference: cartoon tree, 2:1)
A wide panoramic strip of distant snow-capped mountains and snowy hills with small pine forests in exactly the same
cartoon art style as the reference image (the cartoon tree): smooth glossy cartoon rendering, clean edges, soft
gradients, cool bright winter colours, sunny light from the upper left. Only the mountain range silhouette, isolated on
a plain flat pure white background above it and a flat straight bottom edge. No people, no buildings, no text.

## Optional (not wired into the scene yet)

### painted/grass.png (reference: walker, 1:1)
A small clump of wild grass with a few white and yellow wildflowers in exactly the same art style as the reference
image: semi-realistic digital painting, visible textured brush strokes, muted natural colours, sunny light from the
upper left. Whole clump visible, centred, isolated on a plain flat pure white background, no ground, no text.

### cartoon/grass.png (reference: cartoon tree, 1:1)
A small clump of bright green grass with a few white and yellow daisies in exactly the same cartoon art style as the
reference image (the cartoon tree): smooth glossy cartoon rendering, clean edges, soft gradients, bright saturated
colours, lit from the upper left. Whole clump visible, centred, isolated on a plain flat pure white background, no
ground, no text.

## Cartoon walk video (Veo, reference: cartoon walker)

Save as `art/walk-source-cartoon.mp4`. The walk pipeline (tools/walk) expects portrait 720×1280 on chroma-key green.

Settings: 9:16 portrait, 720p or higher, 8 seconds, no audio.

> The man from the reference image walks away from the camera at a slow, steady, relaxed pace, seen directly from
> behind, full body always in frame and centred, from the top of his head to his shoes with some margin. The camera
> follows at a fixed distance and height, so he stays the same size and position on screen; only his legs and arms
> move. Flat, solid, evenly lit chroma-key green background (#00ff00) filling the whole frame, no floor, no shadow, no
> scenery, no other objects. Keep exactly the cartoon style, outfit (dark navy jacket, blue jeans, dark shoes), dark
> hair and realistic body proportions of the reference image. No camera shake, no cuts, no text.

Tips: if his size drifts or the camera wobbles, regenerate. A take where he takes at least 4 even steps gives enough
for a seamless loop. Green on his clothes or hair breaks the key, so reject takes with green reflections.

## Ground textures and skies (both styles, 1:1 textures, 16:9 skies)

Same references as above. [STYLE] is "in exactly the same art style as the reference image: semi-realistic digital
painting, visible textured brush strokes, muted natural colours" (painted) or "in exactly the same cartoon art style as
the reference image (the cartoon tree): smooth glossy cartoon rendering, clean edges, soft gradients, bright saturated
colours" (cartoon). Saved as ground / snow / dirt / snow-path / sky-pt / sky-se; the scene lays the textures on the
ground in perspective (road.ts `perspective`).

- sky-pt: A clear sunny summer sky over northern Portugal [STYLE]: deep blue at the top fading to pale warm blue near the bottom, a few soft wispy clouds high up, sunlight from the upper left. Sky only, no land, no mountains, no sun disc, no text.
- sky-se: A crisp clear winter sky over Sweden [STYLE]: pale cool blue at the top fading to almost white near the bottom, faint thin high clouds, low winter sunlight from the upper left. Sky only, no land, no mountains, no text.
- ground: A seamless tileable texture of a sunny green meadow seen from directly above [STYLE]: short grass with subtle variation, a few tiny scattered wildflowers. Even lighting, no shadows from objects, no path, no horizon, edges that tile seamlessly. No text.
- snow: A seamless tileable texture of fresh snow-covered ground seen from directly above [STYLE]: soft white snow with gentle blue shadows and a faint sparkle. Even lighting, no footprints, no horizon, edges that tile seamlessly. No text.
- dirt: A seamless tileable texture of a packed sandy dirt path seen from directly above [STYLE]: warm tan earth with small pebbles and subtle worn tracks. Even lighting, no grass, no horizon, edges that tile seamlessly. No text.
- snow-path: A seamless tileable texture of a trodden snowy path seen from directly above [STYLE]: packed snow with faint footprints and a little dirt showing through. Even lighting, no horizon, edges that tile seamlessly. No text.

## Cartoon walk video (Seedance, replaces the Veo prompt above)

Attach the cartoon walker (`art/raw/road/cartoon/cartoon-walker.jpg`) as @image1. 9:16, 720p+, 8 s, no audio.

```
SCENE CONTEXT
A young man walks steadily away from the camera on a flat green-screen stage, seen directly from behind, in one continuous shot. He stays centred in the frame for the whole clip while the camera travels forward with him.

ACTIVE REFERENCES
@image1: adult man, slim average build, seen from behind, short dark hair, dark navy zip jacket, mid-blue jeans, dark shoes, glossy cartoon illustration style with clean edges and soft gradients. 100% matches the reference.

LOCATION MAP
Foreground: empty. Midground: the man, centred on the vertical axis of the frame. Background: a flat, solid, evenly lit chroma-key green (#00FF00) filling the entire frame edge to edge. Camera directly behind him at his chest height. Light comes evenly from the front and above, filling the green uniformly.

FIRST FRAME / BLOCKING
First frame: @image1 already mid-stride, full body in frame from the top of his head to the soles of his shoes, with green margin above his head and below his shoes, his back to the camera, facing straight into the frame. His head, shoulders and hips stay aligned with the centre line of the frame throughout.

FORMAT MODE
One continuous shot, the camera does not cut on its own.

OPTICS
Full-body WS, 47° neutral human perspective, rectilinear, deep focus with the whole figure sharp, light natural motion blur on the swinging hands and feet only. No drift mid-segment.

CAMERA
Camera tracks forward behind him at exactly his walking speed, 4 km/h, at a fixed distance and a fixed height, perfectly steady on a smooth dolly. Locked framing: his size and position on screen stay constant from the first frame to the last.

ACTION
He walks at a relaxed, even pace of 4 km/h with a steady rhythm: about two steps per second, eight to ten even steps across the clip, every step the same length and timing. Arms swing gently in opposition to the legs, hands relaxed, a slight natural bounce in the shoulders and head with each step. He keeps looking straight ahead the whole time. Subject motion: only his legs, arms, and a light body bounce. Camera motion: a smooth forward track that keeps him the same size and place in frame.

PHYSICS
Natural walking mechanics: weight shifts from heel to toe on each step, the jacket hem and sleeves sway slightly with the arm swing, the jeans crease at the knees on each stride. His feet stay at the same height in the frame on every footfall.

LIGHTING
Soft, even, shadowless studio light at 5600K from the front and above, the green background lit uniformly with a single flat tone. On the man, soft cartoon shading lit from the upper left, matching @image1. His clothes and hair keep their true colours, with clean edges against the green.

STYLE
Glossy cartoon illustration in motion: smooth shading, clean outlines, soft gradients, bright saturated colours, identical rendering to @image1 in every frame.

OUTPUT SETTINGS
9:16 portrait, 720p or higher, 8 seconds, real-time speed, no audio.

POSITIVE LOCKS
The background stays one flat solid #00FF00 green in every frame, with no floor, horizon, or shadow. He stays the same size, centred, with his full body in frame in every frame. His navy jacket, blue jeans, dark shoes and dark hair stay identical in every frame. His walking rhythm stays constant from start to finish so the cycle loops cleanly.
```
