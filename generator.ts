//! This is only here to process the HTML/MD files in the site/ directory.

import { md, html } from "https://deno.land/x/libmd@v1.10.0/mod.mjs"
import * as libmd from "https://deno.land/x/libmd@v1.10.0/mod.mjs"
import { walk, WalkEntry } from "https://deno.land/std@0.206.0/fs/walk.ts"

const inputDir = "site"
const outputDir = "generated"
try {
    await Deno.mkdir(outputDir)
} catch (e) {}
const index = await Deno.readTextFile("./index.html")

function replaceContent(heading: string, content: string) {
    return index.replace("{{heading}}", heading).replace("{{content}}", content)
}

for await (const entry of walk(inputDir)) {
    if (entry.isDirectory)
        continue
    const { path } = entry;
    if (path.endsWith(".md")) {
        const parsed = md.parser.parse(await Deno.readTextFile(path))
        const { blocks } = parsed as { blocks: md.BlockElement[] };
        let heading = ""
        if (blocks[0] instanceof md.Heading && blocks[0].level == "h1") {
            const headingHtml = md.render_to_html(new md.MDDocument([(blocks.shift() as md.Heading)]));
            const headingValue = (headingHtml.children[0] as html.Element)
            headingValue.attributes = []
            heading = headingValue.html()
        }
        const content = md.render_to_html(parsed)
        content.attributes.push(new html.Attribute("id", "content"))
        
        Deno.writeTextFile(
            outputDir + path.substring(inputDir.length, path.length - 3) + ".html",
            replaceContent(heading, content.html())
        )
    } else {
        Deno.copyFile(path, outputDir +  path.substring(inputDir.length))
    }
}
