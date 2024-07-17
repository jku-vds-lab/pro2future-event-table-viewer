import PrimitiveValue = powerbi.PrimitiveValue;
import { ColumnType, StringOrNumber } from './types';
export interface IColumn {
    name: string;
    source: powerbi.DataViewMetadataColumn;
}

export interface IDataColumn extends IColumn {
    columnType: ColumnType;
    values: PrimitiveValue[];
}

export interface IGlobalSettings {
    colorSettings: IColorSettings;
    eventSettings: IEventSettings;
    lineupSettings: ILineupSettings;
}

export interface ILineupSettings {
    showSidePanel: boolean;
    overviewMode: boolean;
}

export interface IEventSettings {
    sortEvent: string;
    displayEventList: string[];
    boxPlotReferenceColumn?: string;
}

export interface IColorSettings {
    boxPlotColor: string;
}

export interface IEventColumn extends IColumn {
    values: number[];
}

export interface IEventReference {
    column?: IDataColumn;
    values: Date[];
}

export interface ISimilarDurationsColumn extends IColumn {
    values: IBoxPlotData[];
}

export interface ISimilarIDsColumn extends IColumn {
    values: (string | number)[][];
}

export interface IIDColumn extends IColumn {
    values: StringOrNumber[];
    categoryColumn: powerbi.DataViewCategoryColumn;
}

export interface IBoxPlotData {
    min: number;
    max: number;
    median: number;
    q1: number;
    q3: number;
    outliers: number[];
}

export interface CustomMapping {
    columnKey: string;
    min?: number;
    max?: number;
}

export enum IBoxPlotDataKeys {
    min = 'min',
    q1 = 'q1',
    median = 'median',
    q3 = 'q3',
    max = 'max',
}

export enum LineUpAggregationStrategies {
    group = 'group',
    item = 'item',
    groupItem = 'group+item',
    groupTopItem = 'group+top+item',
    groupItemTop = 'group+item+top',
}
