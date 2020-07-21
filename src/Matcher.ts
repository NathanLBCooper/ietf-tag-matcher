import { LanguageTag } from "./LanguageTag";
import { interceptChinese } from "./interceptChinese";
import { AllStringFields, FieldComparer, FieldEqualityComparer } from "./FieldComparer";
import { isNullOrWhitespace } from "./stringUtils";

export class Matcher<TEntity> {
    private _essential: FieldEqualityComparer<TEntity>[];
    private _optional: FieldComparer<TEntity>[];
    private _interceptors: ((tag: TEntity) => TEntity)[];

    constructor(
        essential: FieldEqualityComparer<TEntity>[],
        optionalDescendingPriority: FieldComparer<TEntity>[],
        interceptors: ((entity: TEntity) => TEntity)[]
    ) {
        this._essential = essential;
        this._optional = optionalDescendingPriority;
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
            if (numberOfMatchingOptionals === this._optional.length) {
                return tag;
            }

            const consecutiveEmptyOptionalsAfterMatches = this.countConsecutiveEmptyOptionalFields(interceptedTag, numberOfMatchingOptionals);

            if (currentMatch == null ||
                currentMatch.numberOfMatchingOptionals < numberOfMatchingOptionals ||
                currentMatch.consecutiveEmptyOptionalsAfterMatches < consecutiveEmptyOptionalsAfterMatches) {
                currentMatch = {
                    tag: tag,
                    numberOfMatchingOptionals: numberOfMatchingOptionals,
                    consecutiveEmptyOptionalsAfterMatches: consecutiveEmptyOptionalsAfterMatches
                };
                continue;
            }
        }

        return currentMatch?.tag;
    }

    private hasEssentialDifferences(left: TEntity, right: TEntity): boolean {
        for (const field of this._essential) {
            if (!field.areEqual(left, right)) {
                return true;
            }
        }

        return false;
    }

    private numberOfMatchingOptionals(left: TEntity, right: TEntity): number {
        for (let index = 0; index < this._optional.length; index++) {
            const field = this._optional[index];
            if (!field.areEqual(left, right)) {
                return index;
            }
        }

        return this._optional.length;
    }

    private countConsecutiveEmptyOptionalFields(tag: TEntity, skipFields: number): number {
        let numberOfUndefined = 0;
        for (let index = skipFields; index < this._optional.length; index++) {
            const field = this._optional[index];
            if (field.isEmpty(tag)) {
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

    public static createFromKeys<T extends AllStringFields<T>>(
        essential: (keyof T)[],
        optionalDescendingPriority: (keyof T)[],
        interceptors: ((tag: T) => T)[]): Matcher<T> {
        return new Matcher<T>(
            essential.map(createStringFieldEqualityComparer),
            optionalDescendingPriority.map(createStringFieldComparer),
            interceptors
        )
    }

    public static default(): Matcher<LanguageTag> {
        return this.createFromKeys<LanguageTag>(
            ["language"],
            ["script", "region"],
            [ interceptChinese]
        );
    }
}

export function createStringFieldEqualityComparer<TEntity extends AllStringFields<TEntity>>(key: (keyof TEntity)): FieldEqualityComparer<TEntity> {
    return {
        areEqual: (left: TEntity, right: TEntity) => left[key]?.toLowerCase() === right[key]?.toLowerCase()
    };
}

export function createStringFieldComparer<TEntity extends AllStringFields<TEntity>>(key: (keyof TEntity)): FieldComparer<TEntity> {
    return {
        ...createStringFieldEqualityComparer<TEntity>(key),
        isEmpty: (value: TEntity) => isNullOrWhitespace(value[key])
    };
}

interface CurrentMatch<TEntity> {
    tag: TEntity;
    numberOfMatchingOptionals: number;
    consecutiveEmptyOptionalsAfterMatches: number;
}
