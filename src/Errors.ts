import { Jsonable } from './types';

// export class ParsingError implements Error {
//     /**
//      *
//      */
//     constructor() {
//         //this.cause = undefined;
//     }
// }

export class BaseError extends Error {
    public readonly context?: Jsonable;

    constructor(message: string, options: { error?: Error; context?: Jsonable } = {}) {
        const cause = options.error;
        const context = options.context;
        super(message, { cause });
        this.name = this.constructor.name;

        this.context = context;
    }
}

export class ErrorMessages {
    public static readonly NO_COLUMNS_ERROR = 'No data columns found. Please add at least one data column to the data fields.';
    public static readonly UNKNOWN_COLUMN_TYPE_ERROR = 'Unknown column data type';
    public static readonly INVALID_COLUMN_TYPE_IDS_ERROR =
        'Invalid column data type. Please select a column with numbers separated by semi-colons.';
    public static readonly INVALID_COLUMN_TYPE_NO_DATE_ERROR = 'Invalid column type for Event Column. Please select a column of type date.';
    public static readonly CUSTOM_MAPPING_ERROR = 'Invalid custom column mapping. Please enter a valid JSON object.';
}
