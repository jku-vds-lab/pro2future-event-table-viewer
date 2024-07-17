import powerbi from 'powerbi-visuals-api';
import { ColumnNames, Constants, SettingsNames } from './Constants';
import { ColumnType, StringOrNumber } from './types';
import {
    IBoxPlotDataKeys,
    IDataColumn,
    IEventColumn,
    IGlobalSettings,
    IIDColumn,
    ISimilarDurationsColumn,
    ISimilarIDsColumn,
} from './ViewModelInterfaces';
import * as d3 from 'd3';
import { BaseError, ErrorMessages } from './Errors';

export class ViewModel {
    columnData: IDataColumn[];
    eventColumns: IEventColumn[];
    rowcount: number;
    colCount: number = 0;
    dataRows: Record<string, unknown>[];
    similarDataDurationColumn: ISimilarDurationsColumn;
    similarDataIDsColumn: ISimilarIDsColumn;
    idColumn: IIDColumn;
    globalSettings: IGlobalSettings;
    isParsingError: boolean;

    constructor() {
        this.rowcount = 0;
        this.columnData = [];
        this.dataRows = [];
        this.eventColumns = [];
        this.globalSettings = {
            colorSettings: { boxPlotColor: Constants.BOXPLOT_DEFAULT_COLOR },
            eventSettings: { sortEvent: undefined, displayEventList: [] },
            lineupSettings: { showSidePanel: true, overviewMode: false },
        };
    }

    public parseDataView(dataView: powerbi.DataView): ViewModel {
        this.isParsingError = true;
        const columnSet = new Set<string>();
        const columns = dataView.categorical.categories.filter((x) => {
            const existingElement = columnSet.has(x.source.queryName);
            columnSet.add(x.source.queryName);
            return !existingElement;
        });
        if (dataView.metadata.objects) {
            const objects = dataView.metadata.objects;
            if (objects[SettingsNames.LINEUP_SETTINGS]) {
                this.globalSettings.lineupSettings.showSidePanel = <boolean>(
                    (objects[SettingsNames.LINEUP_SETTINGS][SettingsNames.SHOW_SIDE_PANEL] || true)
                );
                this.globalSettings.lineupSettings.overviewMode = <boolean>(
                    (objects[SettingsNames.LINEUP_SETTINGS][SettingsNames.OVERVIEW_MODE] || false)
                );
            }
        }
        this.rowcount = columns[0].values.length;
        this.colCount = columns.length;
        this.parseDatacolumns(columns);
        this.parseEventColums(columns);
        this.parseSimilarDataDurationColumn(columns);
        this.parseSimilarDataIDsColumn(columns);
        this.parseIDColum(columns);
        this.addDataRows();

        this.isParsingError = false;
        return this;
    }

    private addDataRows() {
        for (let i = 0; i < this.rowcount; i++) {
            const row = {};
            for (const col of this.columnData) {
                row[col.name] = col.values[i];
            }
            const events = {};
            for (const col of this.eventColumns) {
                events[col.name] = col.values[i];
            }
            if (this.similarDataDurationColumn) {
                const boxplotValues = this.similarDataDurationColumn.values[i];
                for (const key of Object.keys(IBoxPlotDataKeys)) {
                    if (boxplotValues && !isNaN(boxplotValues[key])) {
                        events[key] = boxplotValues[key];
                    }
                }
            }
            row[ColumnNames.EVENTS_COLUMN_NAME] = events;
            this.dataRows.push(row);
        }
    }

    parseIDColum(columns: powerbi.DataViewCategoryColumn[]) {
        const idColumnFiltered = columns.filter((x) => x.source.roles[ColumnNames.ID_COLUMN_NAME]);
        if (idColumnFiltered.length === 1 && (idColumnFiltered[0].source.type.numeric || idColumnFiltered[0].source.type.text)) {
            const idColumn = idColumnFiltered[0];
            this.idColumn = {
                name: idColumn.source.displayName,
                values: <StringOrNumber[]>idColumn.values,
                source: idColumn.source,
                categoryColumn: idColumn,
            };
        }
    }
    parseSimilarDataIDsColumn(columns: powerbi.DataViewCategoryColumn[]) {
        const similarDataIdsColumnFiltered = columns.filter((x) => x.source.roles[ColumnNames.SIMILAR_DATA_IDS_COLUMN]);
        if (similarDataIdsColumnFiltered.length === 1) {
            const similarDataIdsColumn = similarDataIdsColumnFiltered[0];
            this.similarDataIDsColumn = {
                name: similarDataIdsColumn.source.displayName,
                values: similarDataIdsColumn.values.map((x) => {
                    if (x === null) return [''];
                    if (typeof x !== 'string') {
                        throw new BaseError(ErrorMessages.INVALID_COLUMN_TYPE_IDS_ERROR, {
                            context: { column: similarDataIdsColumn.source.displayName, value: x },
                        });
                    }
                    return x.split(';').map((x) => (isNaN(Number(x)) ? x : Number(x)));
                }),
                source: similarDataIdsColumn.source,
            };
        }
    }

    private parseSimilarDataDurationColumn(columns: powerbi.DataViewCategoryColumn[]) {
        const similarDataDurationColumnFiltered = columns.filter((x) => x.source.roles[ColumnNames.SIMILAR_DATA_DURATION_COLUMN]);
        if (similarDataDurationColumnFiltered.length === 1) {
            const similarDataDurationColumn = similarDataDurationColumnFiltered[0];
            this.similarDataDurationColumn = {
                name: similarDataDurationColumn.source.displayName,
                values: similarDataDurationColumn.values.map((x: string) => {
                    if (x === null) return null;
                    const numbers = x.split(';').map((p) => Number(p));
                    if (numbers.length < 5) return null;
                    const q1 = d3.quantile(numbers, 0.25);
                    const q3 = d3.quantile(numbers, 0.75);
                    const iqr = q3 - q1;
                    return {
                        min: d3.min(numbers),
                        max: d3.max(numbers),
                        median: d3.quantile(numbers, 0.5),
                        q1,
                        q3,
                        outliers: numbers.filter((x) => x < q1 - iqr * 1.5 || x > q3 + iqr * 1.5),
                    };
                }),
                source: similarDataDurationColumn.source,
            };
        }
    }

    parseEventColums(columns: powerbi.DataViewCategoryColumn[]) {
        const eventDataColumns = columns.filter((x) => x.source.roles[ColumnNames.EVENT_DATA_COLUMNS]);
        if (eventDataColumns.length > 0) this.globalSettings.eventSettings.sortEvent = eventDataColumns[0].source.displayName;

        for (const column of eventDataColumns) {
            this.checkDateType(column);
            const name = column.source.displayName;
            this.eventColumns.push({
                name,
                values: column.values.map((x) => {
                    return Date.parse(<string>x);
                }),
                source: column.source,
            });
        }
        this.eventColumns.sort(
            (a, b) => a.source['rolesIndex'][ColumnNames.EVENT_DATA_COLUMNS][0] - b.source['rolesIndex'][ColumnNames.EVENT_DATA_COLUMNS][0]
        );
        this.globalSettings.eventSettings.displayEventList = this.eventColumns.map((x) => x.name);
    }

    private checkDateType(column: powerbi.DataViewCategoryColumn) {
        if (column.source.type.dateTime) return;
        const types = Object.keys(column.source.type)
            .filter((x) => column.source.type[x] === true)
            .join(', ');
        throw new BaseError(ErrorMessages.INVALID_COLUMN_TYPE_NO_DATE_ERROR, {
            context: { column: column.source.displayName, types },
        });
    }

    private parseDatacolumns(columns: powerbi.DataViewCategoryColumn[]) {
        const dataColumns = columns.filter((x) => x.source.roles[ColumnNames.DATA_COLUMNS]);
        for (const column of dataColumns) {
            const columnType: ColumnType = this.getColumnType(column);

            const dataColumn: IDataColumn = {
                name: column.source.displayName,
                values: column.values,
                columnType: columnType,
                source: column.source,
            };
            this.columnData.push(dataColumn);
        }
    }

    private getColumnType(column: powerbi.DataViewCategoryColumn) {
        let columnType: ColumnType;
        if (column.source.type.numeric) {
            columnType = 'numberColumn';
        } else if (column.source.type.dateTime) {
            columnType = 'dateColumn';
        } else if (column.source.type.bool) {
            columnType = 'booleanColumn';
        } else if (column.source.type.text) {
            columnType = 'categoricalColumn';
        }

        return columnType;
    }
}
