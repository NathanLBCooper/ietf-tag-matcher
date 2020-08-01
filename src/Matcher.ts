import { LanguageTag } from "./LanguageTag";
import { interceptChinese } from "./interceptChinese";
import { AllStringFields, AreEqualCheck, IsEmptyCheck, createEqualityCheck, createEqualityAndEmptyCheck } from "./checks";

export class Matcher<TWanted, TTag> {
    private _essential: AreEqualCheck<TWanted, TTag>[];
    private _optional: (AreEqualCheck<TWanted, TTag> & IsEmptyCheck<TTag>)[];
    private _wantedInterceptors: ((tag: TWanted) => TWanted)[];
    private _tagInterceptors: ((tag: TTag) => TTag)[];

    constructor(
        essential: AreEqualCheck<TWanted, TTag>[],
        optionalDescendingPriority: (AreEqualCheck<TWanted, TTag> & IsEmptyCheck<TTag>)[],
        wantedInterceptors: ((entity: TWanted) => TWanted)[],
        tagInterceptors: ((entity: TTag) => TTag)[]
    ) {
        this._essential = essential;
        this._optional = optionalDescendingPriority;
        this._wantedInterceptors = wantedInterceptors;
        this._tagInterceptors = tagInterceptors;
    }

    public findBestMatchIfExists(wanted: TWanted, tags: TTag[]): TTag | undefined {
        const interceptedWanted = runInterceptors(wanted, this._wantedInterceptors);

        let currentMatch: CurrentMatch<TTag> | undefined;
        for (const tag of tags) {
            const interceptedTag = runInterceptors(tag, this._tagInterceptors);

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

    private hasEssentialDifferences(left: TWanted, right: TTag): boolean {
        for (const field of this._essential) {
            if (!field.areEqual(left, right)) {
                return true;
            }
        }

        return false;
    }

    private numberOfMatchingOptionals(left: TWanted, right: TTag): number {
        for (let index = 0; index < this._optional.length; index++) {
            const field = this._optional[index];
            if (!field.areEqual(left, right)) {
                return index;
            }
        }

        return this._optional.length;
    }

    private countConsecutiveEmptyOptionalFields(tag: TTag, skipFields: number): number {
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

    public static create<T>(
        essential: AreEqualCheck<T, T>[],
        optionalDescendingPriority: (AreEqualCheck<T, T> & IsEmptyCheck<T>)[],
        interceptors: ((entity: T) => T)[]){
            return new Matcher<T, T>(essential, optionalDescendingPriority, interceptors, interceptors);
    }

    public static createFromKeys<T extends AllStringFields<T>>(
        essential: (keyof T)[],
        optionalDescendingPriority: (keyof T)[],
        interceptors: ((tag: T) => T)[]): Matcher<T, T> {
        return new Matcher<T, T>(
            essential.map(createEqualityCheck),
            optionalDescendingPriority.map(createEqualityAndEmptyCheck),
            interceptors,
            interceptors
        );
    }

    public static default(): Matcher<LanguageTag, LanguageTag> {
        return this.createFromKeys<LanguageTag>(
            ["language"],
            ["script", "region"],
            [ interceptChinese]
        );
    }
}

function runInterceptors<T>(tag: T, interceptors: ((tag: T) => T)[]): T {
    let intercepted = tag;
    for (const interceptor of interceptors) {
        intercepted = interceptor(intercepted);
    }

    return intercepted;
}

interface CurrentMatch<TEntity> {
    tag: TEntity;
    numberOfMatchingOptionals: number;
    consecutiveEmptyOptionalsAfterMatches: number;
}
