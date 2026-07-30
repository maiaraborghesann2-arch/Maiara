# public/images

## lykos-avatar.png — REQUIRED, not in the repo yet

The `/briefing` page shows Lykos's portrait in the chat header and next to each
of its messages, loaded from:

    /images/lykos-avatar.png   →   public/images/lykos-avatar.png

**Drop the fox illustration here with exactly that filename.** A transparent PNG,
square, ideally 256×256 or larger — it renders in a circular gold-bordered frame
at 44px (header) and 28px (message bubbles), so anything smaller than ~128px
will look soft on retina screens.

Until the file exists the frame falls back to an "LK" monogram, so the page never
shows a broken image (see `LykosAvatar` in `src/pages/Briefing.tsx`).
