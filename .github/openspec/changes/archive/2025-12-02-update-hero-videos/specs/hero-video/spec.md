## ADDED Requirements

### Requirement: Hero Video Display and Behavior
The hero section MUST display a looping, autoplaying video that showcases the product. This video MUST be theme-aware and responsive.


#### Scenario: Hero Video Display
- **Given** a user visits the homepage
- **When** the page loads
- **Then** the hero section MUST display a video on the right side
- **And** the video MUST loop indefinitely
- **And** the video MUST not require user interaction to play

#### Scenario: Theme Switching
- **Given** the user is in light mode
- **When** the page renders
- **Then** the `3d-light.mp4` video MUST be shown

- **Given** the user is in dark mode
- **When** the page renders
- **Then** the `3d-dark.mp4` video MUST be shown

#### Scenario: Responsiveness
- **Given** the user is on a mobile device
- **When** the page renders
- **Then** the video MUST scale down appropriately and not overflow
- **And** the video MUST not be stretched beyond its original size

#### Scenario: Visual Blending
- **Given** the user is in dark mode
- **When** the video plays
- **Then** it MUST blend seamlessly with the background
- **And** any interfering gradient overlays MUST be handled (removed or layered correctly)
