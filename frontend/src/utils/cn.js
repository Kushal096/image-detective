/** Joins truthy class names. Tiny clsx replacement to avoid a dependency. */
export const cn = (...parts) => parts.filter(Boolean).join(' ');
