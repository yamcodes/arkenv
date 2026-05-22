# Design: Hero Video Update

## Architecture
- **Component**: Modify `apps/www/app/(home)/page.tsx` (or equivalent) to directly render the video or use a new lightweight component.
- **Assets**: Use `public/assets/3d-dark.mp4` and `public/assets/3d-light.mp4`.
- **Styling**: Use Tailwind CSS for responsiveness and positioning.
- **Theme Handling**: Use `next-themes` (or existing theme provider) to detect theme and switch video source.

## Considerations
- **Gradient Overlay**: In dark mode, the global background might have a gradient. We need to ensure the video sits on top of or blends with this. If the video has its own background baked in, we might need to mask the global gradient in that area.
- **Performance**: Ensure videos are optimized and don't cause layout shifts.
