import { expect } from "chai";
import { Matcher } from "./Matcher";
import { LanguageTag } from "./LanguageTag";

describe("Default Matcher", () => {
    const baseSwedish = { language: "sv" };
    const swedishSwedish = { language: "sv", region: "se" };
    const finnishSwedish = { language: "sv", region: "fi" };
    const english = { language: "en" };

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

describe("Default Matcher, Chinese", () => {
    const traditionalChinese = { language: "zh", script: "hant" };
    const taiwanChinese = { language: "zh", region: "TW" };
    const hongKongChinese = { language: "zh", region: "HK" };
    const macauChinese = { language: "zh", region: "MO" };
    const simplifiedChinese  = { language: "zh", script: "hans" };
    const chineseChinese = { language: "zh", region: "CN" };
    const singaporeanChinese = { language: "zh", region: "SG" };
    const malaysianChinese = { language: "zh", region: "MY" };

    const matcher = Matcher.Default();

    it("Match traditional chinese regions with traditional chinese", () => {
        function AssertTraditionalMatch(tag: LanguageTag) {
            {
                const match = matcher.findBestMatchIfExists(tag, [traditionalChinese, simplifiedChinese]);
                compare(<LanguageTag>match, traditionalChinese);
            }
            {
                const match = matcher.findBestMatchIfExists(tag, [simplifiedChinese, traditionalChinese]);
                compare(<LanguageTag>match, traditionalChinese);
            }
        }

        //AssertTraditionalMatch(traditionalChinese);
        AssertTraditionalMatch(taiwanChinese);
        AssertTraditionalMatch(hongKongChinese);
        AssertTraditionalMatch(macauChinese);
    });

    it("Match simplified chinese regions with simplified chinese", () => {
        function AssertSimplifiedMatch(tag: LanguageTag) {
            {
                const match = matcher.findBestMatchIfExists(tag, [traditionalChinese, simplifiedChinese]);
                compare(<LanguageTag>match, simplifiedChinese);
            }
            {
                const match = matcher.findBestMatchIfExists(tag, [simplifiedChinese, traditionalChinese]);
                compare(<LanguageTag>match, simplifiedChinese);
            }
        }

        AssertSimplifiedMatch(simplifiedChinese);
        AssertSimplifiedMatch(chineseChinese);
        AssertSimplifiedMatch(singaporeanChinese);
        AssertSimplifiedMatch(malaysianChinese);
    });

    it("Match traditional chinese regions with each other", () => {
        function AssertTraditionalRegionMatch(left: LanguageTag, right: LanguageTag) {
            {
                const match = matcher.findBestMatchIfExists(left, [simplifiedChinese, chineseChinese, right]);
                compare(<LanguageTag>match, right);
            }
            {
                const match = matcher.findBestMatchIfExists(left, [right, chineseChinese, simplifiedChinese]);
                compare(<LanguageTag>match, right);
            }
        }

        AssertTraditionalRegionMatch(traditionalChinese, taiwanChinese);
        AssertTraditionalRegionMatch(taiwanChinese, hongKongChinese);
        AssertTraditionalRegionMatch(hongKongChinese, macauChinese);
        AssertTraditionalRegionMatch(macauChinese, traditionalChinese);
    });

    it("Match simplified chinese regions with each other", () => {
        function AssertSimplifiedRegionMatch(left: LanguageTag, right: LanguageTag) {
            {
                const match = matcher.findBestMatchIfExists(left, [traditionalChinese, hongKongChinese, right]);
                compare(<LanguageTag>match, right);
            }
            {
                const match = matcher.findBestMatchIfExists(left, [right, hongKongChinese, traditionalChinese]);
                compare(<LanguageTag>match, right);
            }
        }

        AssertSimplifiedRegionMatch(simplifiedChinese, chineseChinese);
        AssertSimplifiedRegionMatch(chineseChinese, singaporeanChinese);
        AssertSimplifiedRegionMatch(singaporeanChinese, malaysianChinese);
        AssertSimplifiedRegionMatch(malaysianChinese, simplifiedChinese);
    });

    it("Match different traditional chinese and simplified chinese if that's the only option (because script is configured as optional)", () => {
        {
            const match = matcher.findBestMatchIfExists(hongKongChinese, [simplifiedChinese]);
            compare(<LanguageTag>match, simplifiedChinese);
        }
        {
            const match = matcher.findBestMatchIfExists(chineseChinese, [hongKongChinese]);
            compare(<LanguageTag>match, hongKongChinese);
        }
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
