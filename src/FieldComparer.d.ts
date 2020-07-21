export interface FieldEqualityComparer<TEntity> {
    areEqual: ((left: TEntity, right: TEntity) => boolean);
}

export interface FieldComparer<TEntity> extends FieldEqualityComparer<TEntity> {
    isEmpty: ((value: TEntity) => boolean);
}

export type AllStringFields<TEntity> = Partial<Record<keyof(TEntity), string | undefined>>;
