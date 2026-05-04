// GitHub Pages SPA redirect decoder
// Works in tandem with public/404.html which encodes the path as a query string.
// This script runs on every page load and restores the real URL for Vue Router.
(function (l) {
  if (l.search[1] === '/') {
    var decoded = l.search
      .slice(1)
      .split('&')
      .map(function (s) { return s.replace(/~and~/g, '&'); })
      .join('?');
    window.history.replaceState(
      null,
      null,
      l.pathname.slice(0, -1) + decoded + l.hash
    );
  }
}(window.location));
