import { expect } from "chai";
import { LanguageTag } from "./LanguageTag";
import { interceptChinese } from "./interceptChinese";

function MakeTestingTag(partialTag?: Partial<LanguageTag>): LanguageTag {
    const defaultTag = {
        language: "this",
        extlang: "is",
        script: "another",
        region: "language",
        variant: "with",
        extension: "some",
        privateUse: "fields"
    };

    return partialTag != null ? { ...defaultTag, ...partialTag } : defaultTag;
}

describe("interceptChinese", () => {
    it("does not change other languages", () => {
        const tag = MakeTestingTag();
        const intercepted = interceptChinese(tag);

        compare(intercepted, tag);
    });

    it("does not change chinese with a script, even if region known", () => {
        const tag = MakeTestingTag({ language: "zh", script: "anything", region: "HK" });
        const intercepted = interceptChinese(tag);

        compare(intercepted, tag);
    });

    it("does not change chinese without a region", () => {
        const tag = MakeTestingTag({ language: "zh", script: undefined, region: undefined });
        const intercepted = interceptChinese(tag);

        compare(intercepted, tag);
    });

    it("adds script for known chinese simplified regions", () => {
        const chineseChinese = MakeTestingTag({ language: "zh", script: "", region: "CN" });
        const singaporeanChinese = MakeTestingTag({ language: "zh", script: "  ", region: "SG" });
        const malaysianChinese = MakeTestingTag({ language: "zh", script: undefined, region: "MY" });

        assertScriptChanged(interceptChinese(chineseChinese), chineseChinese,"hans");
        assertScriptChanged(interceptChinese(singaporeanChinese), singaporeanChinese,"hans");
        assertScriptChanged(interceptChinese(malaysianChinese), malaysianChinese,"hans");
    });

    it("adds script for known chinese traditional regions", () => {
        const taiwanChinese = MakeTestingTag({ language: "zh", script: "", region: "TW" });
        const hongKongChinese = MakeTestingTag({ language: "zh", script: "  ", region: "HK" });
        const macauChinese = MakeTestingTag({ language: "zh", script: undefined, region: "MO" });

        assertScriptChanged(interceptChinese(taiwanChinese), taiwanChinese,"hant");
        assertScriptChanged(interceptChinese(hongKongChinese), hongKongChinese,"hant");
        assertScriptChanged(interceptChinese(macauChinese), macauChinese,"hant");
    });

    it("does not mutate original object", () => {
        const chineseChinese = MakeTestingTag({ language: "zh", script: undefined, region: "CN" });

        interceptChinese(chineseChinese);

        compare(chineseChinese, MakeTestingTag({ language: "zh", script: undefined, region: "CN" }));
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

function assertScriptChanged(output: LanguageTag, input: LanguageTag, expectedScript: string) {
    expect(output.language).equal(input.language);
    expect(output.extlang).equal(input.extlang);
    expect(output.script).equal(expectedScript);
    expect(output.region).equal(input.region);
    expect(output.variant).equal(input.variant);
    expect(output.extension).equal(input.extension);
    expect(output.privateUse).equal(input.privateUse);
}
