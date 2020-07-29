import { isNullOrWhitespace } from "./stringUtils";

export interface AreEqualCheck<TEntity> {
    areEqual: ((left: TEntity, right: TEntity) => boolean);
}

export interface IsEmptyCheck<TEntity> {
    isEmpty: ((value: TEntity) => boolean);
}

export type AllStringFields<TEntity> = Partial<Record<keyof (TEntity), string | undefined>>;

export function createEqualityCheck<TEntity extends AllStringFields<TEntity>>(key: (keyof TEntity)): AreEqualCheck<TEntity> {
    return {
        areEqual: (left: TEntity, right: TEntity) => left[key]?.toLowerCase() === right[key]?.toLowerCase()
    };
}

export function createEqualityAndEmptyCheck<TEntity extends AllStringFields<TEntity>>(key: (keyof TEntity)): (AreEqualCheck<TEntity> & IsEmptyCheck<TEntity>) {
    return {
        ...createEqualityCheck<TEntity>(key),
        isEmpty: (value: TEntity) => isNullOrWhitespace(value[key])
    };
}
