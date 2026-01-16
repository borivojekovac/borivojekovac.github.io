# Context
The project is a blog about AI and related technologies and developments. The blog is called "Wirehead" and is published monthly. The blog is written in English with Serbian translations available for some posts. The blog is published on a personal github.io website.
* The application is a static PWA (Progressive Web App). It was built using coding assistants, with no server-side technology.
* Blog posts are stored in the `posts/` directory and use markdown format.
* Translations are stored in language-specific subdirectories (e.g., `posts/sr/` for Serbian translations).
* Some of the posts are built using coding assistants using instructions from `instructions/` folder, while others are written by hand.
* When new posts are added, some of the files need to be updated in order to display the new posts.

# Task
Your task is to update the blog with new posts and maintain translation metadata.

## Instructions
1. Review the list of posts in the `posts/` directory (English versions).
2. Review translation directories (e.g., `posts/sr/`) to identify available translations.
3. Review contents of `posts.json` file.
4. Update `posts.json` file:
   - Add new English posts to the `posts` array.
   - Update the `translations` object with available translations for each language.
   - For example, if `posts/sr/2026-01-welcome.md` exists, add `"2026-01-welcome.md"` to `translations.sr` array.
5. Review contents of `sitemap.xml` file.
6. Update `sitemap.xml` file:
   - Add entries for new English posts: `/?post=YYYY-MM-title`
   - For posts with translations, add language-specific entries: `/?post=YYYY-MM-title&lang=sr`
   - Include `xhtml:link` elements for alternate language versions (see comment in sitemap.xml for format).
