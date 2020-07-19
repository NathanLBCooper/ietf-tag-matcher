import { LanguageTag } from "./LanguageTag";
import { interceptChinese } from "./interceptChinese";

export class Matcher<TEntity> {
    private _essentialFields: (keyof TEntity)[];
    private _optionalFields: (keyof TEntity)[];
    private _interceptors: ((tag: TEntity) => TEntity)[];

    constructor(essentialFields: (keyof TEntity)[],
        optionalFieldsOrderedByDescendingPriority: (keyof TEntity)[],
        interceptors: ((tag: TEntity) => TEntity)[]) {
        this._essentialFields = essentialFields;
        this._optionalFields = optionalFieldsOrderedByDescendingPriority;
        this._interceptors = interceptors;
    }

    public findBestMatchIfExists(wanted: TEntity, tags: TEntity[]): TEntity | undefined {
        const interceptedWanted = this.runInterceptors(wanted);

        let currentMatch: CurrentMatch<TEntity> | undefined;
        for (const tag of tags) {
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

    private hasEssentialDifferences(left: TEntity, right: TEntity): boolean {
        for (const field of this._essentialFields) {
            if (normalize(left[field]) !== normalize(right[field])) {
                return true;
            }
        }

        return false;
    }

    private numberOfMatchingOptionals(left: TEntity, right: TEntity): number {
        for (let index = 0; index < this._optionalFields.length; index++) {
            const field = this._optionalFields[index];
            if (normalize(left[field]) !== normalize(right[field])) {
                return index;
            }
        }

        return this._optionalFields.length;
    }

    private countConsecutiveNullOptionalFields(tag: TEntity, skipFields: number): number {
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

    private runInterceptors(tag: TEntity): TEntity {
        let intercepted = tag;
        for (const interceptor of this._interceptors) {
            intercepted = interceptor(intercepted);
        }

        return intercepted;
    }

    public static Default(): Matcher<LanguageTag> {
        return new Matcher<LanguageTag>(["language"], ["script", "region"], [interceptChinese]);
    }
}

function normalize(obj: unknown) {
    const isDefinedString = obj != null && Object.prototype.toString.call(obj) === "[object String]";
    if (isDefinedString) {
        return (<string>obj).toLowerCase();
    }

    return obj;
}

interface CurrentMatch<TEntity> {
    tag: TEntity;
    numberOfMatchingOptionals: number;
    consecutiveNullOptionalsAfterMatches: number;
}
