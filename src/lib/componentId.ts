/** Unique IDs keep repeated components' SVG gradients and dialogs independent. */
export const componentId = (prefix: string, id?: string) =>
  id ?? `${prefix}-${crypto.randomUUID()}`;
