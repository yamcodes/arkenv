## ADDED Requirements

### Requirement: Hero Video Display and Behavior
The hero section must display a looping, autoplaying video that showcases the product. This video should be theme-aware and responsive.


#### Scenario: Hero Video Display
- **Given** a user visits the homepage
- **When** the page loads
- **Then** the hero section should display a video on the right side
- **And** the video should loop indefinitely
- **And** the video should not require user interaction to play

#### Scenario: Theme Switching
- **Given** the user is in light mode
- **When** the page renders
- **Then** the `3d-light.mp4` video should be shown

- **Given** the user is in dark mode
- **When** the page renders
- **Then** the `3d-dark.mp4` video should be shown

#### Scenario: Responsiveness
- **Given** the user is on a mobile device
- **When** the page renders
- **Then** the video should scale down appropriately and not overflow
- **And** the video should not be stretched beyond its original size

#### Scenario: Visual Blending
- **Given** the user is in dark mode
- **When** the video plays
- **Then** it should blend seamlessly with the background
- **And** any interfering gradient overlays should be handled (removed or layered correctly)
