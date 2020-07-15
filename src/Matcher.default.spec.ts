import { expect } from "chai";
import { Matcher } from "./Matcher";
import { LanguageTag } from "./LanguageTag";

const baseSwedish = { language: "sv" };
const swedishSwedish = { language: "sv", region: "se" };
const finnishSwedish = { language: "sv", region: "fi" };
const english = { language: "en" };

describe("Default Matcher", () => {
    const matcher = Matcher.Default();

    it("Match regional directly", () => {
        const directMatch = matcher.findBestMatchIfExists(swedishSwedish, [english, baseSwedish, finnishSwedish, swedishSwedish]);
        compare(<LanguageTag>directMatch, swedishSwedish);
    });

    it("Match base directly", () => {
        const directMatch = matcher.findBestMatchIfExists(baseSwedish, [english, baseSwedish, finnishSwedish, swedishSwedish]);
        compare(<LanguageTag>directMatch, baseSwedish);
    });

    it("Match regional to base if no such regional", () => {
        const match = matcher.findBestMatchIfExists(swedishSwedish, [english, finnishSwedish, baseSwedish]);
        compare(<LanguageTag>match, baseSwedish);
    });

    it("Match regional to base if no such regional and no base", () => {
        const match = matcher.findBestMatchIfExists(swedishSwedish, [english, finnishSwedish]);
        compare(<LanguageTag>match, finnishSwedish);
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
