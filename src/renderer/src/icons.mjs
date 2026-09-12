/* eslint-disable @typescript-eslint/explicit-function-return-type -- Módulo JavaScript vanilla; no admite anotaciones de retorno TypeScript. */
// Iconos de navegación locales. Las imágenes de jugadores y habilidades vienen de main.
const shapes = {
  swords:
    '<path d="m4 3 7 7-2 2-7-7V3h2Zm16 0h2v2l-7 7-2-2 7-7ZM3 15l6 6m-4-4-3 3m13-17L3 15m12 0 6 6m-4-4 3 3M3 3l18 18"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6"/>',
  chart: '<path d="M3 3v18h18M6 15l4-5 4 3 6-8"/>',
  skull:
    '<path d="M7 16a8 8 0 1 1 10 0v5H7v-5Zm3 2v3m4-3v3"/><circle cx="9" cy="11" r="1.3"/><circle cx="15" cy="11" r="1.3"/><path d="m11 16 1-2 1 2"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m7 4 13 8-13 8V4Z"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>'
}

export function icon(name) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || ''}</svg>`
}

export function fillIcons(root) {
  root.querySelectorAll('[data-icon]').forEach((node) => {
    node.innerHTML = icon(node.dataset.icon)
  })
}
