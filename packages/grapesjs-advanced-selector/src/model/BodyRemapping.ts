export const BODY_CANVAS_CLASS = 'silex-page-body'

/**
 * Scan all stylesheets in the iframe document for rules targeting `body`
 * and rewrite their selectorText to target the wrapper class instead.
 */
export function rewriteBodyRulesInCanvas(doc: Document) {
  try {
    for (const sheet of Array.from(doc.styleSheets)) {
      rewriteSheet(sheet)
    }
  } catch {
    // Cross-origin sheets may throw; ignore
  }
}

function rewriteSheet(sheet: CSSStyleSheet) {
  try {
    for (const rule of Array.from(sheet.cssRules)) {
      // Use duck-typing instead of instanceof — iframe rules have a different
      // constructor than the parent window's CSSStyleRule/CSSMediaRule
      const styleRule = rule as CSSStyleRule
      if ('selectorText' in rule && styleRule.selectorText) {
        // Match `body` only as a CSS tag selector: at start or after a combinator,
        // and not followed by identifier chars (letter, digit, hyphen, underscore).
        // This skips class names like `.oss-body`, `.body-lg`, `#somebody`.
        if (!styleRule.selectorText.includes(BODY_CANVAS_CLASS)) {
          styleRule.selectorText = styleRule.selectorText.replace(
            /(^|[,\s>+~])body(?![a-zA-Z0-9_-])/g,
            `$1.${BODY_CANVAS_CLASS}`
          )
        }
      } else if ('cssRules' in rule) {
        // Handle rules inside @media blocks
        rewriteSheet(rule as unknown as CSSStyleSheet)
      }
    }
  } catch {
    // Ignore inaccessible sheets
  }
}
