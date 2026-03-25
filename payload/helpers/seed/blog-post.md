# Headings

## Heading 2

## Heading 2 after h2

### Heading 3

### Heading 3 after h3

#### Heading 4

## Heading 1 after h3

### Heading 3 after h1

## Heading 2 after h3

#### Heading 4 after h2

# Heading 1 after h4

# Heading 1 after h1

#### Heading 4 after h1

##### Heading 5

# Emphasis

Emphasis, aka italics, with *asterisks* or *underscores*.

Strong emphasis, aka bold, with **asterisks** or **underscores**.

Combined emphasis with **asterisks and *underscores***.

Strikethrough uses two tildes. ~~Scratch this.~~

**This is bold text**

*This is italic text*

~~Strikethrough~~

# Lists

- Unordered list can use asterisks
- Or minuses
- Or pluses

1. Make my changes
    1. Fix bug
    2. Improve formatting
        - Make the headings bigger
2. Push my commits to GitHub
3. Open a pull request
    - Describe my changes
    - Mention all the members of my team
        - Ask for feedback

- Create a list by starting a line with `+`, `-`, or `*`
- Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
        - Ac tristique libero volutpat at
        - Facilisis in pretium nisl aliquet
        - Nulla volutpat aliquam velit
- Very easy!

---

# Links

[I'm an inline-style link](https://www.google.com)

[https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color\_value/oklch](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch)

[https://zenn.dev/uma002/articles/architecture-abstraction-patterns](https://zenn.dev/uma002/articles/architecture-abstraction-patterns)

# Images

![019d1223-94d4-754c-8f57-47337be15c9e.webp](/api/media/file/019d1223-94d4-754c-8f57-47337be15c9e.webp)

# Code and Syntax Highlighting

Inline `code` has `back-ticks around` it.

```ts
import clsx from "clsx";
import {
        createElement,
        type DetailedHTMLProps,
        Fragment,
        type HTMLAttributes,
        type JSX,
        memo,
} from "react";
import jsxRuntime from "react/jsx-runtime";
import type { Options as RehypeReactOptions } from "rehype-react";
import { renderMarkdown } from "@/helpers/markdown";

export async function Markdown({
        markdown,
        components,
}: {
        markdown: string;
        components?: RehypeReactOptions["components"];
}) {
        const markdownElement = await renderMarkdown({
                markdown,
                rehypeReactOptions: await getRehypeReactOptions({ components }),
        });

        return <>{markdownElement}</>;
}

async function getRehypeReactOptions({
        components,
}: {
        components?: RehypeReactOptions["components"];
}): Promise<RehypeReactOptions> {
        "use server";

        const options: RehypeReactOptions = {
                jsx: jsxRuntime.jsx,
                jsxs: jsxRuntime.jsxs,
                // biome-ignore lint/style/useNamingConvention: follow the API of rehypeReact
                Fragment,
                components,
        };

        // biome-ignore lint/style/noProcessEnv: this is to check if the app is running in development environment
        if (process.env.NODE_ENV === "development") {
                const jsxDevRuntime = await import("react/jsx-dev-runtime");

                options.jsxDEV = jsxDevRuntime.jsxDEV;
        }

        return options;
}

export function createIntrinsicComponent(
        tag: keyof JSX.IntrinsicElements,
        specificClassName?: string,
) {
        return memo(
                ({
                        className,
                        ...props
                }: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) =>
                        createElement(tag, {
                                ...props,
                                className: clsx(specificClassName, className),
                        }),
        );
}

```

# Tables

First Header

Second Header

Third Header

Content Cell

Content Cell

Content Cell

Content Cell

Content Cell

Content Cell

# Blockquotes

> Blockquotes are very handy in email to emulate reply text.This line is part of the same quote.

Quote break.

> This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote.

Quote break again.

> Blockquotes can also be nested......by using additional greater-than signs right next to each other......or with spaces between arrows.

---

# Misc

💡

This is a callout

🐱

This is a catt-out

T^{i\_1 i\_2 \\dots i\_p}{j\_1 j\_2 \\dots j\_q} = T(x^{i\_1},\\dots,x^{i\_p},e{j\_1},\\dots,e\_{j\_q})

# YouTube Videos

[https://www.youtube.com/watch?v=3nonXwpbyEY](https://www.youtube.com/watch?v=3nonXwpbyEY)
