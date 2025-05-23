/* eslint max-len:0 */
import Settings from "../src/Settings";
import {scriptFromCodepoint, supportedCodepoint} from "../src/unicodeScripts";
import {strictSettings, nonstrictSettings} from "./helpers";

describe("unicode", function() {
    it("should build Latin-1 inside \\text{}", function() {
        expect`\text{ÀÁÂÃÄÅÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåèéêëìíîïñòóôõöùúûüýÿÆÇÐØÞßæçðøþ}`
            .toBuild();
    });

    it("should build Latin-1 inside \\text{} like accent commands", function() {
        expect`\text{ÀÁÂÃÄÅÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåèéêëìíîïñòóôõöùúûüýÿÇç}`
            .toParseLike`\text{\`A\'A\^A\~A\"A\r A\`E\'E\^E\"E\`I\'I\^I\"I\~N\`O\'O\^O\~O\"O\`U\'U\^U\"U\'Y\`a\'a\^a\~a\"a\r a\`e\'e\^e\"e\`ı\'ı\^ı\"ı\~n\`o\'o\^o\~o\"o\`u\'u\^u\"u\'y\"y\c C\c c}`;
        // TODO(edemaine): A few characters don't have analogs yet.
    });

    it("should not parse Latin-1 outside \\text{} with strict", function() {
        const chars = 'ÀÁÂÃÄÅÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåèéêëìíîïñòóôõöùúûüýÿÇÐÞçþ';
        for (const ch of chars) {
            expect(ch).not.toParse(strictSettings);
        }
    });

    it("should build Latin-1 outside \\text{}", function() {
        expect`ÀÁÂÃÄÅÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåèéêëìíîïñòóôõöùúûüýÿÇÐÞçðþ`
            .toBuild(nonstrictSettings);
    });

    it("should build all lower case Greek letters", function() {
        expect`αβγδεϵζηθϑικλμνξοπϖρϱςστυφϕχψω`.toBuild();
    });

    it("should build math upper case Greek letters", function() {
        expect`ΓΔΘΛΞΠΣΥΦΨΩ`.toBuild();
    });

    it("should build Cyrillic inside \\text{}", function() {
        expect`\text{БГДЖЗЙЛФЦШЫЮЯ}`.toBuild();
    });

    it("should build Cyrillic outside \\text{}", function() {
        expect`БГДЖЗЙЛФЦШЫЮЯ`.toBuild(nonstrictSettings);
    });

    it("should not parse Cyrillic outside \\text{} with strict", function() {
        expect`БГДЖЗЙЛФЦШЫЮЯ`.not.toParse(strictSettings);
    });

    it("should build CJK inside \\text{}", function() {
        expect`\text{私はバナナです}`.toBuild();
        expect`\text{여보세요}`.toBuild();
    });

    it("should build CJK outside \\text{}", function() {
        expect`私はバナナです`.toBuild(nonstrictSettings);
        expect`여보세요`.toBuild(nonstrictSettings);
    });

    it("should not parse CJK outside \\text{} with strict", function() {
        expect`私はバナナです。`.not.toParse(strictSettings);
        expect`여보세요`.not.toParse(strictSettings);
    });

    it("should build Devanagari inside \\text{}", function() {
        expect`\text{नमस्ते}`.toBuild();
    });

    it("should build Devanagari outside \\text{}", function() {
        expect`नमस्ते`.toBuild(nonstrictSettings);
    });

    it("should not parse Devanagari outside \\text{} with strict", function() {
        expect`नमस्ते`.not.toParse(strictSettings);
    });

    it("should build Georgian inside \\text{}", function() {
        expect`\text{გამარჯობა}`.toBuild();
    });

    it("should build Georgian outside \\text{}", function() {
        expect`გამარჯობა`.toBuild(nonstrictSettings);
    });

    it("should not parse Georgian outside \\text{} with strict", function() {
        expect`გამარჯობა`.not.toParse(strictSettings);
    });

    it("should build Armenian both inside and outside \\text{}", function() {
        expect`ԱԲԳաբգ`.toBuild(nonstrictSettings);
        expect`\text{ԱԲԳաբգ}`.toBuild(nonstrictSettings);
    });

    it("should build extended Latin characters inside \\text{}", function() {
        expect`\text{ěščřžůřťďňőİı}`.toBuild();
    });

    it("should not parse extended Latin outside \\text{} with strict", function() {
        expect`ěščřžůřťďňőİı`.not.toParse(strictSettings);
    });

    it("should not allow emoji in strict mode", function() {
        expect`✌`.not.toParse(strictSettings);
        expect`\text{✌}`.not.toParse(strictSettings);
        const settings = new Settings({
            strict: (errorCode) =>
                (errorCode === "unknownSymbol" ? "error" : "ignore"),
        });
        expect`✌`.not.toParse(settings);
        expect`\text{✌}`.not.toParse(settings);
    });

    it("should allow emoji outside strict mode", function() {
        expect`✌`.toWarn();
        expect`\text{✌}`.toWarn();
        const settings = new Settings({
            strict: (errorCode) =>
                (errorCode === "unknownSymbol" ? "ignore" : "error"),
        });
        expect`✌`.toParse(settings);
        expect`\text{✌}`.toParse(settings);
    });
});

describe("unicodeScripts", () => {
    const scriptRegExps = {
        // eslint-disable-next-line no-misleading-character-class
        latin: /[\u0100-\u024f\u0300-\u036f]/,
        cyrillic: /[\u0400-\u04ff]/,
        armenian: /[\u0530-\u058F]/,
        brahmic: /[\u0900-\u109F]/,
        georgian: /[\u10a0-\u10ff]/,
        cjk: /[\u3000-\u30FF\u4E00-\u9FAF\uFF00-\uFF60]/,
        hangul: /[\uAC00-\uD7AF]/,
    };

    const scriptNames = Object.keys(scriptRegExps);

    const allRegExp = new RegExp(
        scriptNames.map(script => scriptRegExps[script].source).join('|')
    );

    it("should verify supportedCodepoint for Latin characters", () => {
        for (let codepoint = 0x0100; codepoint <= 0x036f; codepoint++) {
            expect(supportedCodepoint(codepoint)).toBe(
                allRegExp.test(String.fromCharCode(codepoint))
            );
        }
    });

    it("should verify supportedCodepoint for Cyrillic characters", () => {
        for (let codepoint = 0x0400; codepoint <= 0x04ff; codepoint++) {
            expect(supportedCodepoint(codepoint)).toBe(
                allRegExp.test(String.fromCharCode(codepoint))
            );
        }
    });

    it("should verify supportedCodepoint for Armenian characters", () => {
        for (let codepoint = 0x0530; codepoint <= 0x058F; codepoint++) {
            expect(supportedCodepoint(codepoint)).toBe(
                allRegExp.test(String.fromCharCode(codepoint))
            );
        }
    });

    it("should verify supportedCodepoint for Brahmic characters", () => {
        for (let codepoint = 0x0900; codepoint <= 0x109F; codepoint++) {
            expect(supportedCodepoint(codepoint)).toBe(
                allRegExp.test(String.fromCharCode(codepoint))
            );
        }
    });

    it("should verify supportedCodepoint for Georgian characters", () => {
        for (let codepoint = 0x10a0; codepoint <= 0x10ff; codepoint++) {
            expect(supportedCodepoint(codepoint)).toBe(
                allRegExp.test(String.fromCharCode(codepoint))
            );
        }
    });

    it("should verify supportedCodepoint for CJK characters", () => {
        for (let codepoint = 0x3000; codepoint <= 0x9FAF; codepoint++) {
            expect(supportedCodepoint(codepoint)).toBe(
                allRegExp.test(String.fromCharCode(codepoint))
            );
        }
    });

    it("should verify supportedCodepoint for Hangul characters", () => {
        for (let codepoint = 0xAC00; codepoint <= 0xD7AF; codepoint++) {
            expect(supportedCodepoint(codepoint)).toBe(
                allRegExp.test(String.fromCharCode(codepoint))
            );
        }
    });

    it("scriptFromCodepoint() should return correct values", () => {
        outer: for (let codepoint = 0; codepoint <= 0xffff; codepoint++) {
            const character = String.fromCharCode(codepoint);
            const script = scriptFromCodepoint(codepoint);

            for (const scriptName of scriptNames) {
                if (scriptRegExps[scriptName].test(character)) {
                    expect(script).toEqual(scriptName);
                    continue outer;
                }
            }

            expect(script).toBe(null);
            expect(supportedCodepoint(codepoint)).toBe(false);
        }
    });
});
