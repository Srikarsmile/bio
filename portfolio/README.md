# Portfolio: a short illustrated guide

An illustrated portfolio that reads like a picture book. On desktop it's an open book whose pages turn in 3D. On phones it becomes a flip-pad: text on top, picture below, and pages flip upward.

It's static HTML, CSS and JS with no build step. To run it locally:

```bash
cd portfolio && python3 -m http.server 8000
```

## Reading it
- Turn pages with **← →**, a click on either page, a swipe, or the buttons under the book.
- **Contents** jumps to a chapter. Every spread has its own link (`#p1` … `#p10`, `#end`).
- **The grown-up version** on each text page opens the technical detail for recruiters.

## Gaussian splats
`splat.js` rebuilds each illustration from thousands of soft 3D gaussians. It uses the same maths as 3D Gaussian Splatting: a 3D covariance is projected to a 2D ellipse and blended back to front. It's a small WebGL2 renderer with no dependencies. The splats swirl in when a page opens, tilt with the pointer, and part around the cursor.

- Edges and lettering use many tiny splats to stay crisp; fills use larger brush-like ones.
- Reduced-motion users, browsers without WebGL2, and machines that can't keep up all get the flat SVG drawings automatically.
- Add `?splats=force` to the URL to keep splats on even on a slow GPU.

## Editing
- Each leaf in `index.html` is one sheet of paper. Its front is a right-hand page and its back is the next left-hand page.
- Story text goes in `.say` headings. Recruiter detail goes in the `<template id="noteN">` next to each one.
- Search for `EDIT:` to find placeholders: your bio and contact email.
- There are three inks, set per page with `data-theme="cream" | "tomato" | "ink"`.

## Deploying (Vercel)
Create a new Vercel project from this repo and set **Root Directory** to `portfolio`. There's no build command.
