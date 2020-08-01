import { expect } from "chai";
import { Matcher } from "./Matcher";
import { createEqualityAndEmptyCheck } from "./checks";
import { LanguageTag } from "./LanguageTag";

interface LanguageTagWithFamily extends LanguageTag {
    languageFamily: string;
}

interface LanguageTagWithUnderstoodBy extends LanguageTag {
    understoodBy?: string[];
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
        function compareUnderstoodBy(left: LanguageTag, right: LanguageTagWithUnderstoodBy): boolean {
            return left.language === right.language || (right.understoodBy != null && right.understoodBy.includes(left.language));
        }

        function addUnderstoodBy(tag: LanguageTagWithUnderstoodBy): LanguageTagWithUnderstoodBy {
            if (tag.language === "sv") {
                return { ...tag, understoodBy: ["da"] };
            }
            else {
                return { ...tag };
            }
        }

        const matcher = new Matcher<LanguageTag, LanguageTagWithUnderstoodBy>(
            [{
                areEqual: compareUnderstoodBy
            }],
            [
                createEqualityAndEmptyCheck<LanguageTag>("language")
            ],
            [],
            [addUnderstoodBy]
        );

        const swedish = { language: "sv" };
        const norwegian = { language: "no", understoodBy: ["da"] }
        const danish = { language: "da" };

        const danishIsImpossible = matcher.findBestMatchIfExists(swedish, [danish]);
        const swedishIsGood = matcher.findBestMatchIfExists(danish, [swedish]);
        const norwegianIsAlsoFine = matcher.findBestMatchIfExists(danish, [norwegian]);

        expect(danishIsImpossible).undefined;
        compare(<LanguageTagWithFamily>swedishIsGood, swedish);
        compare(<LanguageTagWithFamily>norwegianIsAlsoFine, norwegian);
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
