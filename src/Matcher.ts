import { LanguageTag, LanguageTagField } from "./LanguageTag";

export class Matcher {
    private _essentialFields: LanguageTagField[];
    private _optionalFields: LanguageTagField[];

    constructor(essentialFields: LanguageTagField[],
        optionalFieldsOrderedByDescendingPriority: LanguageTagField[]) {
        this._essentialFields = essentialFields;
        this._optionalFields = optionalFieldsOrderedByDescendingPriority;
    }

    public findBestMatchIfExists(wanted: LanguageTag, tags: LanguageTag[]): LanguageTag | undefined {
        let currentMatch: CurrentMatch | undefined;
        for (const tag of tags) {
            if (this.hasEssentialDifferences(wanted, tag)) {
                continue;
            }

            const numberOfMatchingOptionals = this.numberOfMatchingOptionals(wanted, tag);
            if (numberOfMatchingOptionals === this._optionalFields.length) {
                return tag;
            }

            const consecutiveNullOptionalsAfterMatches = this.countConsecutiveNullOptionalFields(tag, numberOfMatchingOptionals);

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

    public static Default(): Matcher {
        return new Matcher(["language"], ["region"]);
    }
}

interface CurrentMatch {
    tag: LanguageTag;
    numberOfMatchingOptionals: number;
    consecutiveNullOptionalsAfterMatches: number;
}
