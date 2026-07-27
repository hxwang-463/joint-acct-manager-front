import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  /*
   * Emit every route as <route>/index.html rather than <route>.html.
   *
   * Without this the export writes both `spend.html` and a `spend/` directory
   * of build assets. A static file server asked for `/spend` finds the
   * directory, not the file, and answers with a redirect to `/spend/` — built
   * as an absolute URL from its own listen port, so refreshing the page landed
   * on `:8443` and then on nothing, because that directory has no index.
   *
   * With a real index.html inside `spend/`, the directory it was already
   * redirecting to is the right place to land.
   */
  trailingSlash: true,
};

export default nextConfig;
