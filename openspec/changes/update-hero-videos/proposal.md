# Update Hero Videos

## Context
The current hero section uses a `VideoDemo` component that is not suitable for the new transparent 3D videos. The new videos (`3d-dark.mp4` and `3d-light.mp4`) require specific handling for responsiveness, looping, and blending with the background, especially in dark mode where a gradient overlay interferes.

## Problem
- `VideoDemo` component emits a glow that is incompatible with the new transparent videos.
- Dark mode background has a gradient overlay that needs to be managed (removed or layered) for the video to blend correctly.
- Videos need to be responsive and loop without user input.

## Solution
- Replace `VideoDemo` with a custom implementation using `video` tags.
- Implement theme-aware video switching.
- Adjust CSS/layout to handle the dark mode gradient overlay.
- Ensure responsive design and correct video sizing.

## Impact
- **Users**: Improved visual experience in the hero section.
- **Devs**: New implementation for hero video, removal of `VideoDemo` usage in hero (but potentially kept for other uses if any).
