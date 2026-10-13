import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RichText } from "./RichText";

const html = (text: string) => renderToStaticMarkup(<RichText text={text} />);

describe("RichText", () => {
  it("renders code, bold and italic", () => {
    const out = html("use `std::move` **only** when *needed*");
    expect(out).toMatch(/use <code[^>]*>std::move<\/code> <strong[^>]*>only<\/strong> when <em>needed<\/em>/);
  });

  it("leaves pointer and multiplication asterisks alone", () => {
    const out = html("a int* p and x * y and 2 * 3 * 4");
    expect(out).not.toContain("<em>");
    expect(out).toContain("int* p and x * y and 2 * 3 * 4");
  });

  it("doesn't format inside code spans", () => {
    expect(html("`a *b* c`")).not.toContain("<em>");
  });

  it("escapes HTML and splits paragraphs and code blocks", () => {
    const out = html("<b>hi</b>\n\nsecond\n```\nint main() {}\n```");
    expect(out).toContain("&lt;b&gt;hi&lt;/b&gt;");
    expect(out.match(/<p /g)).toHaveLength(2);
    expect(out).toContain("<pre");
  });

  it("turns consecutive '- ' lines into a list", () => {
    const out = html("Intro:\n- one\n- `two`\nAfter.");
    expect(out).toMatch(/<p[^>]*>Intro:<\/p><ul[^>]*><li>one<\/li><li><code[^>]*>two<\/code><\/li><\/ul><p[^>]*>After\.<\/p>/);
  });

  it("leaves a dash inside a sentence alone", () => {
    expect(html("x - y")).not.toContain("<li>");
  });
});
