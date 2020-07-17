import { LanguageTag, LanguageTagField } from "./LanguageTag";
import { interceptChinese } from "./interceptChinese";

export class Matcher {
    private _essentialFields: LanguageTagField[];
    private _optionalFields: LanguageTagField[];
    private _interceptors: ((tag: LanguageTag) => LanguageTag)[];

    constructor(essentialFields: LanguageTagField[],
        optionalFieldsOrderedByDescendingPriority: LanguageTagField[],
        interceptors: ((tag: LanguageTag) => LanguageTag)[]) {
        this._essentialFields = essentialFields;
        this._optionalFields = optionalFieldsOrderedByDescendingPriority;
        this._interceptors = interceptors;
    }

    public findBestMatchIfExists(wanted: LanguageTag, tags: LanguageTag[]): LanguageTag | undefined {
        const interceptedWanted = this.runInterceptors(wanted);

        let currentMatch: CurrentMatch | undefined;
        for (let tag of tags) {
            const interceptedTag = this.runInterceptors(tag);

            if (this.hasEssentialDifferences(interceptedWanted, interceptedTag)) {
                continue;
            }

            const numberOfMatchingOptionals = this.numberOfMatchingOptionals(interceptedWanted, interceptedTag);
            if (numberOfMatchingOptionals === this._optionalFields.length) {
                return tag;
            }

            const consecutiveNullOptionalsAfterMatches = this.countConsecutiveNullOptionalFields(interceptedTag, numberOfMatchingOptionals);

            if (currentMatch == null ||
                currentMatch.numberOfMatchingOptionals < numberOfMatchingOptionals ||
                currentMatch.consecutiveNullOptionalsAfterMatches < consecutiveNullOptionalsAfterMatches) {
                currentMatch = {
                    tag: tag,
                    numberOfMatchingOptionals: numberOfMatchingOptionals,
                    consecutiveNullOptionalsAfterMatches: consecutiveNullOptionalsAfterMatches
                };
                continue;
            }
        }

        return currentMatch?.tag;
    }

    private hasEssentialDifferences(left: LanguageTag, right: LanguageTag): boolean {
        for (const field of this._essentialFields) {
            if (left[field]?.toLowerCase() !== right[field]?.toLowerCase()) {
                return true;
            }
        }

        return false;
    }

    private numberOfMatchingOptionals(left: LanguageTag, right: LanguageTag): number {
        for (let index = 0; index < this._optionalFields.length; index++) {
            const field = this._optionalFields[index];
            if (left[field]?.toLowerCase() !== right[field]?.toLowerCase()) {
                return index;
            }
        }

        return this._optionalFields.length;
    }

    private countConsecutiveNullOptionalFields(tag: LanguageTag, skipFields: number): number {
        let numberOfUndefined = 0;
        for (let index = skipFields; index < this._optionalFields.length; index++) {
            const field = this._optionalFields[index];
            if (tag[field] == null) {
                numberOfUndefined++;
            } else {
                break;
            }
        }

        return numberOfUndefined;
    }

    private runInterceptors(tag: LanguageTag): LanguageTag {
        let intercepted = tag;
        for (const interceptor of this._interceptors) {
            intercepted = interceptor(intercepted);
        }

        return intercepted;
    }

    public static Default(): Matcher {
        return new Matcher(["language"], ["script", "region"], [interceptChinese]);
    }
}

interface CurrentMatch {
    tag: LanguageTag;
    numberOfMatchingOptionals: number;
    consecutiveNullOptionalsAfterMatches: number;
}
