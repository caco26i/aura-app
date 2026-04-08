/**
 * First focusable control for keyboard / AT users; jumps to #main-content (landmark must use tabIndex={-1}).
 */
export function SkipToContent() {
  return (
    <a href="#main-content" className="aura-skip-link">
      Skip to main content
    </a>
  );
}
