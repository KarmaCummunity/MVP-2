// App-wide display version (FR-GLOWE-025 / D-181).
// Source of truth: app/VERSION. Kept in sync by scripts/bump-app-version.mjs
// and re-stamped by app/scripts/web-postbuild.mjs on every web deploy.
(function (root) {
<<<<<<< HEAD
    root.GloweAppVersion = { version: '1.0.12' };
=======
    root.GloweAppVersion = { version: '1.0.5' };
>>>>>>> 4d0ea757 (feat(glowe-web): auto-translate forum threads and replies)
})(typeof self !== 'undefined' ? self : this);
