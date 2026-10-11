# Deadbeat Records concept store

A static, five-page vinyl shop concept built with plain HTML, CSS, and vanilla JavaScript. There is no build step.

## Deploy to Netlify

1. Add this folder to a Git repository and push it to GitHub, GitLab, or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project** and connect the repository.
3. Leave the build command blank. Set the publish directory to `.` (already set in `netlify.toml`), then deploy.

You can also drag and drop the project folder into Netlify's manual deploy area.

## Editing the concept

- Edit the collections and sample catalog in `js/products.js`. Every record has a unique `id`, a `collection` slug, editable `tags`, stock and pressing details, and a cover path in `assets/covers/`.
- Keep five records assigned to each collection to preserve the curated 30-record layout. Product details intentionally omit tracklists.
- Replace `assets/logo.svg` and `assets/hero.jpg` with your supplied logo and hero image.
- Cart contents persist in the browser's local storage. Newsletter, contact, and checkout forms are visual demos and do not submit data.
