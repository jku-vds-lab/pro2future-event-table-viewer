export type ColumnType = CatCol | NumCol | DateCol | BoolCol;

export type CatCol = 'categoricalColumn';
export type NumCol = 'numberColumn';
export type DateCol = 'dateColumn';
export type BoolCol = 'booleanColumn';
export type StringOrNumber = string | number;
export type Jsonable =
    | string
    | number
    | boolean
    | null
    | undefined
    | readonly Jsonable[]
    | { readonly [key: string]: Jsonable }
    | { toJSON(): Jsonable };
