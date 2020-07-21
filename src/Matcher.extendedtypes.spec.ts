import { expect } from "chai";
import { Matcher, createStringFieldComparer } from "./Matcher";
import { LanguageTag } from "./LanguageTag";

interface LanguageTagWithFamily extends LanguageTag {
    languageFamily: string;
}

interface LanguageTagWithUnderstoodBy extends LanguageTag {
    understoodBy: string[];
}

describe("Matcher, extended types", () => {
    it("Can match on custom fields", () => {
        const matcher = Matcher.createFromKeys<LanguageTagWithFamily>(["languageFamily"], ["language"], []);

        const swedish = { languageFamily: "north germanic", language: "sv" };
        const danish = { languageFamily: "north germanic", language: "da" };
        const english = { languageFamily: "west germanic", language: "en" };

        const match = matcher.findBestMatchIfExists(swedish, [english, danish]);

        compare(<LanguageTag>match, danish);
    });

    it("Can match on complex non-symmetrical relationships", () => {
        function compareUnderstoodBy(left: LanguageTagWithUnderstoodBy, right: LanguageTagWithUnderstoodBy): boolean {
            return left.language === right.language || right.understoodBy.includes(left.language);
        }

        const matcher = new Matcher(
            [{
                areEqual: compareUnderstoodBy
            }],
            [
                createStringFieldComparer<LanguageTag>("language")
            ],
            []
        )

        const swedish = { understoodBy: ["da"], language: "sv" };
        const danish = { understoodBy: [], language: "da" };

        const swedeMatch = matcher.findBestMatchIfExists(swedish, [danish]);
        const daneMatch = matcher.findBestMatchIfExists(danish, [swedish]);

        expect(swedeMatch).undefined;
        compare(<LanguageTag>daneMatch, swedish);
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
