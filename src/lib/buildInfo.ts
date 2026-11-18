/** Version comes from package.json (bumped by semantic-release). */
export const buildInfo = {
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
  author: typeof __APP_AUTHOR__ !== 'undefined' ? __APP_AUTHOR__ : 'Letlhogonolo Sekwati',
}

/** Keep first + last name on one line when the stamp wraps. */
export function authorStamp(): string {
  return buildInfo.author.replace(/ /g, '\u00A0')
}

export function formatBuildStamp(): string {
  return `v${buildInfo.version} · built by ${authorStamp()}`
}
