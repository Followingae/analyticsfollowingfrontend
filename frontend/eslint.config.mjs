import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/*
 * Card padding is a design decision, not a per-screen one.
 *
 * A Card pads at 24px. Every per-instance override in this codebase makes one
 * tighter, never roomier, which is how 650 cards ended up with a dozen
 * different internal margins and no card looking deliberate. The reason is
 * almost always that something else is wrong: a title too big, a stat that
 * wanted a Stat rather than a Card, a grid packed one column too far.
 *
 * So this is a warning, not an error. It does not fail a build, it fails a
 * review: if you keep the override, say in the diff why this card is not like
 * the other 650.
 *
 * `px-0` / `p-0` are caught too, on purpose. A flush table or an image that
 * bleeds to the card edge is a real thing, and also exactly the case worth a
 * sentence.
 */
const CARD_PADDING_OVERRIDE =
  'JSXOpeningElement[name.name=/^Card(Content|Header|Footer)$/] > JSXAttribute[name.name="className"] > Literal[value=/(^|\s)!?(p|px|py|pt|pb|pl|pr)-/]';

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: CARD_PADDING_OVERRIDE,
          message:
            "Card pads at 24px. Overriding it here makes this card unlike the other 650, so either drop the override or say in the diff why this one is different.",
        },
      ],
    },
  },
];

export default eslintConfig;
