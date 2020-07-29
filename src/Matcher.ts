import { LanguageTag } from "./LanguageTag";
import { interceptChinese } from "./interceptChinese";
import { AllStringFields, AreEqualCheck, IsEmptyCheck, createEqualityCheck, createEqualityAndEmptyCheck } from "./checks";

export class Matcher<TEntity> {
    private _essential: AreEqualCheck<TEntity>[];
    private _optional: (AreEqualCheck<TEntity> & IsEmptyCheck<TEntity>)[];
    private _interceptors: ((tag: TEntity) => TEntity)[];

    constructor(
        essential: AreEqualCheck<TEntity>[],
        optionalDescendingPriority: (AreEqualCheck<TEntity> & IsEmptyCheck<TEntity>)[],
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
            essential.map(createEqualityCheck),
            optionalDescendingPriority.map(createEqualityAndEmptyCheck),
            interceptors
        );
    }

    public static default(): Matcher<LanguageTag> {
        return this.createFromKeys<LanguageTag>(
            ["language"],
            ["script", "region"],
            [ interceptChinese]
        );
    }
}

interface CurrentMatch<TEntity> {
    tag: TEntity;
    numberOfMatchingOptionals: number;
    consecutiveEmptyOptionalsAfterMatches: number;
}
