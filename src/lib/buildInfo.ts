/** Version comes from package.json (bumped by semantic-release). */
export const buildInfo = {
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
  author: typeof __APP_AUTHOR__ !== 'undefined' ? __APP_AUTHOR__ : 'Letlhogonolo Sekwati',
}

export function formatBuildStamp(): string {
  return `v${buildInfo.version} · built by ${buildInfo.author}`
}
