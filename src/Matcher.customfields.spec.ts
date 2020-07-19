import { expect } from "chai";
import { Matcher } from "./Matcher";
import { LanguageTag } from "./LanguageTag";

interface LanguageTagWithFamily extends LanguageTag {
    languageFamily: string;
}

describe("Matcher, Custom Fields", () => {
    const matcher = new Matcher<LanguageTagWithFamily>(["languageFamily"], ["language"], []);

    it("Can match on custom fields", () => {
        const swedish = { languageFamily: "north germanic", language: "sv" };
        const danish = { languageFamily: "north germanic", language: "da" };
        const english = { languageFamily: "west germanic", language: "en" };

        const match = matcher.findBestMatchIfExists(swedish, [english, danish]);

        compare(<LanguageTag>match, danish);
    });
});

function compare(actual: LanguageTag, expected: LanguageTag) {
    expect(actual.language).equal(expected.language);
    expect(actual.extlang).equal(expected.extlang);
    expect(actual.script).equal(expected.script);
    expect(actual.region).equal(expected.region);
    expect(actual.variant).equal(expected.variant);
    expect(actual.extension).equal(expected.extension);
    expect(actual.privateUse).equal(expected.privateUse);
}
