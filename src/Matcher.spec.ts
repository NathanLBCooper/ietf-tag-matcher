import { expect } from "chai";
import { Matcher } from "./Matcher";
import { LanguageTag } from "./LanguageTag";

function MakeTestingTag(partialTag?: Partial<LanguageTag>): LanguageTag {
    const defaultTag = {
        language: "language",
        extlang: "extlang",
        script: "script",
        region: "region",
        variant: "variant",
        extension: "extension",
        privateUse: "private use"
    };

    return partialTag != null ? { ...defaultTag, ...partialTag } : defaultTag;
}

describe("Matcher Simple Priority", () => {
    const matcher = Matcher.createFromKeys<LanguageTag>(
        ["language", "extlang", "script", "region"],
        ["variant", "extension", "privateUse"],
        []
    );

    const tag = MakeTestingTag();
    // Named after whether the optional fields match
    const match_match_match = MakeTestingTag();
    const match_match_diff = MakeTestingTag({ privateUse: "DIFFERENT privateUse" });
    const match_diff_match = MakeTestingTag({ extension: "DIFFERENT extension" });
    const diff_match_match = MakeTestingTag({ variant: "DIFFERENT variant" });
    const non_matching_essential_fields = MakeTestingTag({ script: "DIFFERENT SCRIPT" });

    it("First choice is a complete match", () => {
        const tags = [match_match_match, match_match_diff, match_diff_match, diff_match_match, non_matching_essential_fields].reverse();

        const match = matcher.findBestMatchIfExists(tag, tags);
        compare(<LanguageTag>match, match_match_match);
    });

    it("Next a match with the least important optional different", () => {
        {
            const tags = [match_match_diff, match_diff_match, diff_match_match, non_matching_essential_fields].reverse();

            const match = matcher.findBestMatchIfExists(tag, tags);
            compare(<LanguageTag>match, match_match_diff);
        }
        {
            const tags = [match_diff_match, diff_match_match, non_matching_essential_fields].reverse();

            const match = matcher.findBestMatchIfExists(tag, tags);
            compare(<LanguageTag>match, match_diff_match);
        }
        {
            const tags = [diff_match_match, non_matching_essential_fields].reverse();

            const match = matcher.findBestMatchIfExists(tag, tags);
            compare(<LanguageTag>match, diff_match_match);
        }
    });

    it("If a more important optional does not match it doesn't matter whether the others match or not", () => {
        const diff_diff_diff = MakeTestingTag({ variant: "DIFFERENT variant", extension: "DIFFERENT extension", privateUse: "DIFFERENT privateUse" });

        const tags = [diff_match_match, diff_diff_diff];
        const reverseTags = [diff_diff_diff, diff_match_match];

        const match = matcher.findBestMatchIfExists(tag, tags);
        const reverseMatch = matcher.findBestMatchIfExists(tag, reverseTags);

        // If it doesn't matter, I'm assuming it's somehow related to order.
        expect(match?.extension).not.equal(reverseMatch?.extension);
        expect(match?.extension == diff_match_match.extension || match?.extension == diff_diff_diff.extension);
        expect(reverseMatch?.extension == diff_match_match.extension || reverseMatch?.extension == diff_diff_diff.extension);
    });

    it("But any difference in essential fields isn't okay, return undefined", () => {
        const tags = [non_matching_essential_fields];

        const match = matcher.findBestMatchIfExists(tag, tags);
        expect(match).equal(undefined);
    });

    it("Prefer the least specific tag after a difference, so prefer a change that changes to undefined", () => {
        const matcher = Matcher.createFromKeys<LanguageTag>(["language"], ["variant"], []);

        const tag = MakeTestingTag();
        const variant_different = MakeTestingTag({ variant: "DIFFERENT variant" });
        const variant_undefined = MakeTestingTag({ variant: undefined });

        const tags = [variant_different, variant_undefined];

        {
            const match = matcher.findBestMatchIfExists(tag, tags);
            compare(<LanguageTag>match, variant_undefined);
        }
        {
            const match = matcher.findBestMatchIfExists(tag, tags.reverse());
            compare(<LanguageTag>match, variant_undefined);
        }
    });

    it("Prefer the least specific tag after a difference, so after a change to undefined prefer the tag values to continue as undefined", () => {
            const matcher = Matcher.createFromKeys<LanguageTag>([], ["language", "region"], []);

            const tag = MakeTestingTag();
            const undefined_hasValue = MakeTestingTag({ language: undefined, region: tag.region });
            const undefined_undefined = MakeTestingTag({ language: undefined, region: undefined });
            /* Note: It doesn't matter than the region is the same, it's in the context of a different language,
            so we're choosing less specificity to be better*/

            const tags = [undefined_hasValue, undefined_undefined];

            {
                const match = matcher.findBestMatchIfExists(tag, tags);
                compare(<LanguageTag>match, undefined_undefined);
            }
            {
                const match = matcher.findBestMatchIfExists(tag, tags.reverse());
                compare(<LanguageTag>match, undefined_undefined);
            }
        });
});

describe("Matcher Other", () => {
    it("Comparisons ignore case", () => {
        const matcher = Matcher.createFromKeys<LanguageTag>(["language"], ["variant"], []);
        const tag = MakeTestingTag();
        const differentCaseTag: LanguageTag = {
            language: tag.language.toUpperCase(),
            extlang: tag.extlang?.toLowerCase(),
            script: tag.script?.toUpperCase(),
            region: tag.region?.toLowerCase(),
            variant: tag.variant?.toUpperCase(),
            extension: tag.extension?.toLowerCase(),
            privateUse: tag.privateUse?.toUpperCase()
        };

        const match = matcher.findBestMatchIfExists(tag, [differentCaseTag]);
        compare(<LanguageTag>match, differentCaseTag);
    });

    it("Irrelevant differences don't matter", () => {
        const matcher = Matcher.createFromKeys<LanguageTag>(["language"], ["variant"], []);

        const tag = MakeTestingTag();
        const irrelevant_differences = MakeTestingTag({ extlang: "DIFFERENT extlang", script: "DIFFERENT script" });
        const optional_differences = MakeTestingTag({ variant: "DIFFERENT variant" });

        const tags = [optional_differences, irrelevant_differences];

        {
            const match = matcher.findBestMatchIfExists(tag, tags);
            compare(<LanguageTag>match, irrelevant_differences);
        }
        {
            const match = matcher.findBestMatchIfExists(tag, tags.reverse());
            compare(<LanguageTag>match, irrelevant_differences);
        }
    });

    it("All tags are passed through the provided interceptors, but the output is not mutated", () => {
        const swedish = { language: "se" };
        const danish = { language: "da" };
        const english = { language: "en" };
        const french = { language: "fr" };
        function MoveSouth(tag: LanguageTag) {
            switch (tag.language) {
                case "se":
                    return danish;
                case "en":
                    return french;
                default:
                    throw "MoveSouth";
            }
        }
        function TurnDanishIntoFrench(tag: LanguageTag) {
            switch (tag.language) {
                case "da":
                    return french;
                default:
                    return tag;
            }
        }

        const matcher = Matcher.createFromKeys<LanguageTag>(["language"], [], [MoveSouth, TurnDanishIntoFrench]);

        const match = matcher.findBestMatchIfExists(swedish, [english]);

        compare(<LanguageTag>match, english);
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
