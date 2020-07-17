import { LanguageTag } from "./LanguageTag";
import { isNullOrWhitespace } from "./stringUtils";

export function interceptChinese(tag: LanguageTag): LanguageTag {
    if (tag.language?.toLowerCase() != "zh" || !isNullOrWhitespace(tag.script) || isNullOrWhitespace(tag.region)) {
        return tag;
    }

    const region = (<string>tag.region).toLowerCase();

    if (["cn", "sg", "my"].includes(region)) {
        return {...tag, script: "hans" }
    } else if (["tw", "hk", "mo"].includes(region)) {
        return {...tag, script: "hant" }
    }

    return tag;
}
