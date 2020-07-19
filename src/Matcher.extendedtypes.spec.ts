import { expect } from "chai";
import { Matcher } from "./Matcher";
import { LanguageTag } from "./LanguageTag";

interface LanguageTagWithFamily extends LanguageTag {
    languageFamily: string;
}

// interface LanguageTagWithUnderstoodBy extends LanguageTag {
//     understoodBy: string[];
// }

describe("Matcher, extended types", () => {
    it("Can match on custom fields", () => {
        const matcher = new Matcher<LanguageTagWithFamily>(["languageFamily"], ["language"], []);

        const swedish = { languageFamily: "north germanic", language: "sv" };
        const danish = { languageFamily: "north germanic", language: "da" };
        const english = { languageFamily: "west germanic", language: "en" };

        const match = matcher.findBestMatchIfExists(swedish, [english, danish]);

        compare(<LanguageTag>match, danish);
    });

    // it.skip("Can match on complex non-symmetrical relationships", () => {
    //     /** Not supported is this even a thing you'd need? */

    //     const matcher = new Matcher<LanguageTagWithUnderstoodBy>(["understoodBy"], ["language"], []);

    //     const swedish = { understoodBy: ["sv", "da"], language: "sv" };
    //     const danish = { understoodBy: ["da"], language: "da" };

    //     const swedeMatch = matcher.findBestMatchIfExists(danish, [swedish]);
    //     const daneMatch = matcher.findBestMatchIfExists(danish, [swedish]);

    //     expect(swedeMatch).undefined;
    //     compare(<LanguageTag>daneMatch, swedish);
    // });
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
