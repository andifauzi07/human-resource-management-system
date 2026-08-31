import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/* ----------------------------------------------------------------------------
 * Rule kustom: design-system/no-hardcoded-style
 *
 * Menolak nilai style literal di luar design system (lihat docs/DESIGN-SYSTEM.md):
 *  - warna raw di luar token  : bg-indigo-600, text-white, text-[#123456], dsb.
 *  - nilai arbitrary warna    : bg-[#…], shadow-[…], rounded-[8px]
 *  - shadow/radius off-scale  : shadow-jumbo, rounded-2xl (bukan skala)
 * Token yang dibolehkan hanya set semantik yang didefinisikan di `@theme`.
 * -------------------------------------------------------------------------- */

const COLOR_UTILS = [
  'ring-offset',
  'placeholder',
  'decoration',
  'outline',
  'ring',
  'border',
  'divide',
  'accent',
  'caret',
  'bg',
  'text',
  'fill',
  'stroke',
  'from',
  'to',
  'via',
]

const COLOR_TOKENS = new Set([
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'info',
  'info-foreground',
  'border',
  'input',
  'ring',
  'transparent',
  'inherit',
  'current',
])

// Kata yang melekat pada util tetapi BUKAN warna (lebar/sisi/posisi/ukuran).
const NON_COLOR_NAMES = new Map([
  [
    'bg',
    new Set([
      'none',
      'cover',
      'contain',
      'fixed',
      'local',
      'scroll',
      'repeat',
      'no-repeat',
      'repeat-x',
      'repeat-y',
      'repeat-round',
      'repeat-space',
      'auto',
      'center',
      'top',
      'bottom',
      'left',
      'right',
      'clip-border',
      'clip-padding',
      'clip-content',
      'clip-text',
      'origin-border',
      'origin-padding',
      'origin-content',
      'gradient-to-t',
      'gradient-to-tr',
      'gradient-to-r',
      'gradient-to-br',
      'gradient-to-b',
      'gradient-to-bl',
      'gradient-to-l',
      'gradient-to-tl',
    ]),
  ],
  [
    'text',
    new Set([
      'xs',
      'sm',
      'base',
      'lg',
      'xl',
      '2xl',
      '3xl',
      '4xl',
      '5xl',
      '6xl',
      '7xl',
      '8xl',
      '9xl',
      'left',
      'center',
      'right',
      'justify',
      'start',
      'end',
      'balance',
      'pretty',
      'wrap',
      'nowrap',
      'clip',
      'ellipsis',
    ]),
  ],
  [
    'border',
    new Set([
      't',
      'b',
      'l',
      'r',
      'x',
      'y',
      's',
      'e',
      'solid',
      'dashed',
      'dotted',
      'double',
      'hidden',
      'none',
      'collapse',
      'separate',
    ]),
  ],
  ['ring', new Set(['inset'])],
  ['outline', new Set(['none', 'hidden', 'dashed', 'dotted', 'double'])],
  ['divide', new Set(['x', 'y', 'reverse'])],
  ['fill', new Set(['none'])],
  ['stroke', new Set(['none'])],
  ['accent', new Set(['none'])],
  ['caret', new Set(['none'])],
  [
    'decoration',
    new Set([
      'none',
      'underline',
      'overline',
      'line-through',
      'wavy',
      'solid',
      'double',
      'dashed',
      'dotted',
      'from-font',
    ]),
  ],
])

const SHADOW_SCALE = new Set(['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'])
const RADIUS_SCALE = new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'])
const RADIUS_SIDES = ['t', 'b', 'l', 'r', 's', 'e', 'tl', 'tr', 'bl', 'br', 'ss', 'se', 'ee', 'es']
const RADIUS_RE = new RegExp(
  `^rounded-(?:${RADIUS_SIDES.join('|')})-(?:none|xs|sm|md|lg|xl|2xl|3xl|full)$`
)

// Bentuk literal warna (hex/rgb/hsl/oklch dst.) — arbitrary non-token.
const COLOR_LITERAL = /^(?:#[\da-fA-F]{3,8}|rgba?\(|hsla?\(|hwb\(|lab\(|oklch\(|oklab\(|color\()/

function lastSegment(raw) {
  const idx = raw.lastIndexOf(':')
  return idx === -1 ? raw : raw.slice(idx + 1)
}

function isVarRef(content) {
  return content.startsWith('--') || content.startsWith('var(')
}

function checkClassString(context, node, classString) {
  for (const raw of classString.split(/\s+/)) {
    if (!raw) continue
    checkToken(context, node, raw)
  }
}

function checkToken(context, node, raw) {
  const segment = lastSegment(raw.replace(/^!+/, "").replace(/!+$/, ""))

  // Radius
  if (segment.startsWith('rounded')) {
    if (
      segment === 'rounded' ||
      /^rounded-(?:none|xs|sm|md|lg|xl|2xl|3xl|full)$/.test(segment) ||
      RADIUS_RE.test(segment)
    ) {
      return
    }
    if (/^rounded-\x5b[^\x5d]*\x5d$/.test(segment) || /^rounded-\([^)]*\)$/.test(segment)) {
      const content = segment.slice(8, -1)
      if (isVarRef(content)) return
      context.report({ node, messageId: 'radiusArbitrary', data: { value: segment } })
      return
    }
    context.report({ node, messageId: 'radiusOffScale', data: { value: segment } })
    return
  }

  // Shadow / depth
  if (segment === 'shadow' || segment.startsWith('shadow-')) {
    const value = segment.slice('shadow'.length)
    const name = value.replace(/^-/, '')
    if (name === '' || SHADOW_SCALE.has(name)) return
    if (value.startsWith('-[') || value.startsWith('-(')) {
      const content = value.slice(2, -1)
      if (isVarRef(content)) return
      context.report({ node, messageId: 'shadowArbitrary', data: { value: segment } })
      return
    }
    context.report({ node, messageId: 'shadowOffScale', data: { value: segment } })
    return
  }

  // Warna (util berbasis warna)
  for (const util of COLOR_UTILS) {
    if (!segment.startsWith(`${util}-`)) continue
    const rest = segment.slice(util.length + 1)

    if (rest.startsWith('[') || rest.startsWith('(')) {
      const content = rest.slice(1, -1)
      if (isVarRef(content)) break
      if (COLOR_LITERAL.test(content)) {
        context.report({ node, messageId: 'colorArbitrary', data: { value: segment } })
      }
      break
    }

    const name = rest.split('/')[0]
    if (COLOR_TOKENS.has(name)) break
    if (NON_COLOR_NAMES.get(util)?.has(name)) break
    if (/^\d+$/.test(name) || /^\d+(\.\d+)?%$/.test(name)) break
    // border<side>-<width> (border-b-0) & divide<axis>-<width> (divide-x-2)
    if (util === 'border' && /^(?:t|l|r|b|x|y|s|e)(?:-\d+)?$/.test(name)) break
    if (util === 'divide' && /^(?:x|y)(?:-\d+)?$/.test(name)) break
    context.report({ node, messageId: 'colorOffToken', data: { value: segment } })
    break
  }
}

const noHardcodedStyle = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Tolak nilai style literal di luar design system: warna di luar token, shadow/radius off-scale, dan arbitrary color.',
    },
    schema: [],
    messages: {
      colorOffToken:
        'Warna "{{value}}" di luar token design system — gunakan token semantik (bg-primary, text-muted-foreground, dst.).',
      colorArbitrary:
        'Nilai arbitrary warna "{{value}}" tidak dibolehkan — gunakan token dari @theme.',
      shadowOffScale:
        'Shadow "{{value}}" di luar skala depth token — gunakan shadow-none/2xs/xs/sm/md/lg/xl/2xl.',
      shadowArbitrary:
        'Nilai arbitrary shadow "{{value}}" tidak dibolehkan — gunakan skala depth token.',
      radiusOffScale:
        'Radius "{{value}}" di luar skala token — gunakan rounded-none/xs/sm/md/lg/xl/2xl/3xl/full.',
      radiusArbitrary:
        'Nilai arbitrary radius "{{value}}" tidak dibolehkan — gunakan skala radius token.',
    },
  },
  create(context) {
    function checkLiteral(node, literal) {
      if (typeof literal !== 'string') return
      checkClassString(context, node, literal)
    }

    function checkClassAttribute(node) {
      const attrName = node.name?.name
      if (attrName !== 'className') return
      const value = node.value
      if (!value) return
      if (value.type === 'Literal') {
        checkLiteral(node, value.value)
      } else if (
        value.type === 'TemplateLiteral' &&
        value.expressions.length === 0
      ) {
        checkLiteral(node, value.quasis.map((q) => q.value.cooked).join(''))
      }
    }

    function checkCnCall(node) {
      const callee = node.callee
      if (callee.type !== 'Identifier' || callee.name !== 'cn') return
      for (const arg of node.arguments) {
        if (arg.type === 'Literal') {
          checkLiteral(node, arg.value)
        } else if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0) {
          checkLiteral(node, arg.quasis.map((q) => q.value.cooked).join(''))
        }
      }
    }

    // Primitif shadcn menaruh class di dalam `cva(base, { variants: {...} })`.
    // Telusuri seluruh argumen cva dan cek string literal (tanpa menyentuh
    // key object yang dikutip).
    function walkStrings(value, visit, inKey) {
      if (!value || typeof value !== 'object') return
      if (Array.isArray(value)) {
        for (const item of value) walkStrings(item, visit, false)
        return
      }
      if (value.type === 'Literal' && typeof value.value === 'string') {
        if (!inKey) visit(value, value.value)
        return
      }
      if (
        value.type === 'TemplateLiteral' &&
        value.expressions.length === 0
      ) {
        if (!inKey) visit(value, value.quasis.map((q) => q.value.cooked).join(''))
        return
      }
      for (const key of Object.keys(value)) {
        if (key === 'parent') continue
        const child = value[key]
        if (!child || typeof child !== 'object') continue
        if (Array.isArray(child)) {
          walkStrings(child, visit, false)
        } else {
          walkStrings(child, visit, key === 'key')
        }
      }
    }

    function checkCvaCall(node) {
      if (node.callee.type !== 'Identifier' || node.callee.name !== 'cva') return
      for (const arg of node.arguments) {
        walkStrings(arg, (strNode, value) => checkLiteral(strNode, value), false)
      }
    }

    return {
      JSXAttribute: checkClassAttribute,
      CallExpression: (node) => {
        checkCnCall(node)
        checkCvaCall(node)
      },
    }
  },
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'design-system': { rules: { 'no-hardcoded-style': noHardcodedStyle } },
    },
    rules: {
      'design-system/no-hardcoded-style': 'error',
    },
  },
  {
    // Route file-based TanStack Router wajib mengekspor objek Route (bukan
    // komponen), dan primitif shadcn/ui mengekspor varian cva — keduanya
    // memang melanggar asumsi fast-refresh, jadi aturan ini dilonggarkan.
    files: ['src/routes/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])