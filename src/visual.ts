/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
'use strict';

import powerbi from 'powerbi-visuals-api';
import { IBasicFilter } from 'powerbi-models';
import * as pbimodels from 'powerbi-models';
import { FormattingSettingsService } from 'powerbi-visuals-utils-formattingmodel';
import './../style/visual.less';

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import VisualUpdateType = powerbi.VisualUpdateType;
import { ColumnNames, Constants, HTMLConstants, LayoutConstants, SettingsNames } from './Constants';
import { VisualFormattingSettingsModel } from './settings';
import * as LineUp from 'lineup-eventdata';

import { ViewModel } from './ViewModel';
import * as d3 from 'd3';
import { Jsonable, StringOrNumber } from './types';
import { BaseError, ErrorMessages } from './Errors';
import { CustomMapping, LineUpAggregationStrategies } from './ViewModelInterfaces';
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from 'powerbi-visuals-utils-tooltiputils';
import { valueFormatter } from 'powerbi-visuals-utils-formattingutils';

export class Visual implements IVisual {
    private target: HTMLElement;
    private mainDiv: HTMLElement;
    private lineUpTarget: HTMLElement;
    private footerDiv: HTMLElement;

    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: ISelectionManager;
    private builder: LineUp.DataBuilder;
    private dataView: powerbi.DataView;
    private selectedRows: number[] = [];
    private filterSimilar: boolean = false;
    private taggle: LineUp.Taggle;
    private host: powerbi.extensibility.visual.IVisualHost;
    private setFilter: boolean = false;
    private viewModel: ViewModel;
    private selectedIDs: StringOrNumber[] = [];
    private legendContainer: HTMLDivElement;
    private highlight: number = -1;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private aggregationStrategy: LineUpAggregationStrategies = LineUpAggregationStrategies.group;
    private currentZoom = 1;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.selectionManager = this.host.createSelectionManager();
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
    }

    public update(options: VisualUpdateOptions) {
        if (this.setFilter) {
            this.setFilter = false;
            return;
        }

        const updateType = this.getVisualUpdateType(options.type);
        const formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews
        );
        const formattingChanged = JSON.stringify(this.formattingSettings) !== JSON.stringify(formattingSettings);
        this.formattingSettings = formattingSettings;
        this.filterSimilar = this.formattingSettings.filterCard.filterSimilarDefault.value;
        if (!options?.dataViews.length) {
            this.createLandingPage();
            return;
        }

        if ((updateType.data && !formattingChanged) || updateType.all || this.dataView === undefined) {
            this.dataView = options.dataViews[0];

            if (this.host.fetchMoreData(true) && this.dataView.metadata.segment) {
                this.setErrorMessage('Please wait for the data to load', {
                    'rows loaded': this.dataView?.categorical?.categories[0].values.length,
                });
                return;
            }
        }
        if (updateType.data) {
            this.updateViewModel();
            this.updateView();
        } else if (options.type & VisualUpdateType.Resize) {
            this.calculateZoom();
        }
    }

    private createLandingPage() {
        this.clearTarget();
        const header: HTMLElement = document.createElement('h3');
        header.appendChild(document.createTextNode('LineUp Event Data Visual'));
        this.target.appendChild(header);

        const documentationP = document.createElement('p');
        documentationP.appendChild(document.createTextNode('The Documentation can be found under: '));
        this.target.appendChild(documentationP);
        const link = document.createElement('a');
        const documentationLink = 'https://jku-vds-lab.at/pro2future-event-table-viewer/';
        link.appendChild(document.createTextNode(documentationLink));
        link.href = documentationLink;
        link.target = '_blank';
        this.target.appendChild(link);
        this.target.appendChild(document.createElement('br'));
        this.target.appendChild(document.createElement('br'));
        const messageP = document.createElement('p');
        messageP.appendChild(document.createTextNode(ErrorMessages.NO_COLUMNS_ERROR));
        this.target.appendChild(messageP);
    }

    private updateViewModel() {
        try {
            this.viewModel = new ViewModel();
            this.viewModel.parseDataView(this.dataView);
        } catch (e) {
            const error = this.ensureError(e);
            if (error instanceof BaseError) {
                this.setErrorMessage(error.message, error.context);
            } else {
                this.setErrorMessage(error.message);
            }
        }
    }

    private updateView() {
        !this.viewModel.isParsingError && this.buildLineup();
    }

    public destroy(): void {
        console.log('destroy visual');
    }

    private persistLineupSettings(reset = false) {
        const properties = {};
        properties[SettingsNames.LINEUP_JSON_DUMP] = reset ? undefined : JSON.stringify(this.taggle.dump());
        properties[SettingsNames.SHOW_SIDE_PANEL] = reset ? true : this.viewModel.globalSettings.lineupSettings.showSidePanel;
        properties[SettingsNames.OVERVIEW_MODE] = reset ? false : this.taggle.isOverviewMode() || false;
        this.host.persistProperties({
            replace: [{ objectName: SettingsNames.LINEUP_SETTINGS, properties: properties, selector: undefined }],
        });
    }

    private loadLineupDump() {
        const lineupSettings = this.dataView.metadata.objects?.[SettingsNames.LINEUP_SETTINGS];
        if (
            lineupSettings &&
            lineupSettings[SettingsNames.LINEUP_JSON_DUMP] &&
            typeof lineupSettings[SettingsNames.LINEUP_JSON_DUMP] === 'string'
        ) {
            const json = <string>lineupSettings[SettingsNames.LINEUP_JSON_DUMP];
            const dump: LineUp.IDataProviderDump = JSON.parse(json);
            this.resetMappings(dump);
            return dump;
        }
        return null;
    }

    private resetMappings(dump: LineUp.IDataProviderDump) {
        const customMappings = this.getCustomMappings().filter((x) => x.min === undefined && x.max === undefined);
        dump.rankings.map((r) =>
            r.columns
                .filter(
                    (x) =>
                        typeof x.desc === 'string' &&
                        !customMappings.map((k) => k.columnKey).includes(x.desc.split('@')[1].toLowerCase()) &&
                        x.map
                )
                .map((x) => delete x.map)
        );
        dump.rankings.map((r) =>
            r.columns
                .filter((x) => typeof x.desc === 'string' && x.desc.split('@')[0].toLowerCase() === 'event')
                .map((x) => {
                    delete x['msPerUnit'];
                })
        );
    }

    private getCustomMappings(): CustomMapping[] {
        try {
            const parsedObject = JSON.parse(this.formattingSettings.lineupCard.customMapping.value);
            const customMappings: CustomMapping[] = [];
            for (const [key, value] of Object.entries(parsedObject)) {
                if (!Array.isArray(value)) {
                    throw new Error('The value of the custom mapping ' + key + ' is not an array');
                }
                if (value.length !== 2 && value.length !== 0) {
                    throw new Error('The array of the custom mapping ' + key + ' does not have the right length (0 or 2)');
                }
                const mapping: CustomMapping = { columnKey: key.toLowerCase() };
                if (value.length === 2) {
                    if (typeof value[0] !== 'number' || typeof value[1] !== 'number') {
                        throw new Error('The array of the custom mapping ' + key + ' does not contain numbers');
                    }
                    mapping.min = value[0];
                    mapping.max = value[1];
                }
                customMappings.push(mapping);
            }

            return customMappings;
        } catch (e) {
            const error = this.ensureError(e);
            this.setErrorMessage(error.message, {
                error: ErrorMessages.CUSTOM_MAPPING_ERROR,
                'invalid JSON': this.formattingSettings.lineupCard.customMapping.value,
            });
        }
    }

    private ensureError(value: unknown): Error {
        if (value instanceof Error) return value;

        let stringified = '[Unable to stringify the thrown value]';
        try {
            stringified = JSON.stringify(value);
        } catch {
            // nothing
        }

        const error = new Error(`This value was thrown as is, not through an Error: ${stringified}`);
        return error;
    }

    private setErrorMessage(message: string, context?: Jsonable) {
        if (document) {
            this.clearTarget();
            this.target.appendChild(document.createElement('br'));
            const header: HTMLElement = document.createElement('h3');
            header.appendChild(document.createTextNode(message));
            if (context) {
                for (const key of Object.keys(context)) {
                    header.appendChild(document.createElement('br'));
                    header.appendChild(document.createTextNode(`${key}: ${context[key]}`));
                }
            }
            this.target.appendChild(header);
        }
    }

    private clearTarget() {
        d3.select(this.target).selectAll('*').remove();
        this.lineUpTarget = undefined;
        this.currentZoom = 1;
    }

    private buildLineup() {
        this.builder = new LineUp.DataBuilder(this.viewModel.dataRows);
        this.buildLineupEventColumn();
        this.buildLineupDataColumns();
        this.builder
            .sidePanel(true, !this.viewModel.globalSettings.lineupSettings.showSidePanel)
            .aggregationStrategy(this.formattingSettings.lineupCard.aggregationStrategy.value.value as LineUpAggregationStrategies);

        if (this.viewModel.globalSettings.lineupSettings.overviewMode) this.builder.overviewMode();

        this.handleTaggleBuild();
    }

    private handleTaggleBuild() {
        if (
            this.taggle &&
            this.lineUpTarget &&
            this.aggregationStrategy === this.formattingSettings.lineupCard.aggregationStrategy.value.value
        ) {
            this.aggregationStrategy = this.formattingSettings.lineupCard.aggregationStrategy.value.value;
            this.updateTaggle();
        } else {
            this.buildNewTaggle();
        }
        d3.select('div.lu-collapser').on('click', () => {
            this.calculateZoom();
            this.viewModel.globalSettings.lineupSettings.showSidePanel = !this.viewModel.globalSettings.lineupSettings.showSidePanel;
        });
        this.calculateZoom();
    }

    private checkSetEquality<T>(setA: Set<T>, setB: Set<T>) {
        if (setA.size !== setB.size) return false;
        for (const a of setA) if (!setB.has(a)) return false;
        return true;
    }

    private updateTaggle() {
        const dataProvider = this.builder.buildData();
        const oldCols = this.taggle.data.getColumns();
        const oldColumnsArray = this.getDumpColumnNames(oldCols);
        const newCols = dataProvider.getColumns();
        const newColumsArray = this.getDumpColumnNames(newCols);

        if (JSON.stringify(oldColumnsArray) === JSON.stringify(newColumsArray)) {
            const dump = this.taggle.dump();
            this.resetMappings(dump);
            if (this.selectedIDs.length > 0) {
                dump.selection = this.selectedIDs.map((x) => this.viewModel.idColumn.values.indexOf(x)).filter((x) => x >= 0);
            } else {
                dump.selection = [];
            }
            this.taggle.setDataProvider(dataProvider, dump);
            this.taggle.update();
        } else {
            this.buildNewTaggle();
        }
    }

    private getDumpColumnNames(columns: LineUp.IColumnDesc[]) {
        const oldColumnsArray = columns.map((x) => x.label);
        columns
            .filter((x) => x.type === ColumnNames.LINEUP_EVENT_COLUMN_NAME)
            .map((x) => {
                if (x[Constants.DISPLAY_EVENT_LIST]) x[Constants.DISPLAY_EVENT_LIST].map((colName) => oldColumnsArray.push(colName));
            });
        return oldColumnsArray;
    }

    private buildNewTaggle() {
        this.clearTarget();
        this.mainDiv = document.createElement('div');
        this.mainDiv.id = 'main-div';
        this.target.appendChild(this.mainDiv);
        this.lineUpTarget = document.createElement('div');
        this.mainDiv.appendChild(this.lineUpTarget);
        this.buildFooter();

        const dump = this.loadLineupDump();
        const dataProvider = this.builder.buildData();
        if (dump) {
            const newColumns = new Set(dataProvider.getColumns().map((x) => (x as any).column));
            const savedColumns = new Set();
            dump.rankings.map((r) => {
                r.columns = r.columns.filter((x) => {
                    if (typeof x.desc !== 'string') return true;

                    const colName = x.desc.split('@')[1];
                    if (newColumns.has(colName)) {
                        savedColumns.add(colName);
                    }
                    return newColumns.has(colName);
                });
            });

            if (!this.checkSetEquality(savedColumns, newColumns)) {
                dataProvider.dump().rankings[0].columns.map((x, i) => {
                    if (typeof x.desc !== 'string') return x;
                    const colName = x.desc.split('@')[1];
                    if (!savedColumns.has(colName)) {
                        x.id = 'col' + (Math.max(...dump.rankings[0].columns.map((x) => Number(x.id.replace('col', '')))) + 1);
                        dump.rankings[0].columns.splice(i, 0, x);
                    }
                });
                this.builder.restore(dump);
            }
            this.builder.restore(dump);
        }
        this.taggle = this.builder.buildTaggle(this.lineUpTarget);
        this.taggle.on('selectionChanged', (selection: number[]) => {
            this.selectedRows = selection;
            this.updatedFilter();
        });
        this.taggle.on('highlightChanged', (selection: number) => {
            this.highlight = selection;
        });

        this.target.addEventListener('contextmenu', (e) => {
            if (e.shiftKey) return;
            const col = this.viewModel.idColumn?.categoryColumn || this.dataView.categorical.categories[0];
            const selectionID = this.host.createSelectionIdBuilder().withCategory(col, this.highlight).createSelectionId();
            this.selectionManager.showContextMenu(selectionID, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
    }

    private updatedFilter() {
        if (this.selectedRows.length > 0) {
            if (this.filterSimilar && this.viewModel.similarDataIDsColumn) {
                if (this.viewModel.idColumn) {
                    this.selectedIDs = this.selectedRows.map((x) => this.viewModel.idColumn.values[x]);
                }
                const similarIDs = new Set<string | number>();
                for (const i of this.selectedRows) {
                    this.viewModel.similarDataIDsColumn.values[i].map((x) => similarIDs.add(x));
                }

                const filter: IBasicFilter = {
                    $schema: 'https://powerbi.com/product/schema#basic',
                    target: {
                        table: this.formattingSettings.filterCard.similarIDTable.value,
                        column: this.formattingSettings.filterCard.similarIDColumn.value,
                    },
                    operator: 'In',
                    values: Array.from(similarIDs),
                    filterType: pbimodels.FilterType.Basic,
                };
                this.applyFilter(filter);
            } else if (!this.filterSimilar && this.viewModel.idColumn) {
                const split = this.viewModel.idColumn.source.queryName.split('.');
                const filter: IBasicFilter = {
                    $schema: 'https://powerbi.com/product/schema#basic',
                    target: {
                        table: split[0],
                        column: split[1],
                    },
                    operator: 'In',
                    values: Array.from(this.selectedRows.map((x) => this.viewModel.idColumn.values[x])),
                    filterType: pbimodels.FilterType.Basic,
                };
                this.applyFilter(filter);
            }
        } else {
            this.selectedIDs = [];
            this.applyFilter(null);
        }
    }

    private buildFooter() {
        this.footerDiv = document.createElement('div');
        this.footerDiv.setAttribute('style', `height: ${LayoutConstants.BOTTOM_DIV_HEIGHT}px`);
        this.footerDiv.className = HTMLConstants.FOOTER_CLASS;
        this.mainDiv.appendChild(this.footerDiv);
        this.legendContainer = document.createElement('div');
        this.legendContainer.className = HTMLConstants.FOOTER_LEGEND_CONTAINER_CLASS + ' ' + 'svg-container';
        this.footerDiv.appendChild(this.legendContainer);
        const buttonContainer = document.createElement('div');
        buttonContainer.className = HTMLConstants.BUTTON_CONTAINER_CLASS;
        this.footerDiv.appendChild(buttonContainer);
        const filterDiv = document.createElement('div');
        filterDiv.id = HTMLConstants.FILTER_DIV_ID;
        buttonContainer.appendChild(filterDiv);
        const filterDivSelection = d3.select(filterDiv);

        filterDivSelection
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', HTMLConstants.CHECKBOX_INPUT_ID)
            .on('change', (evt) => {
                this.filterSimilar = evt.target.checked;
                this.updatedFilter();
            })
            .property('checked', this.filterSimilar);
        filterDivSelection
            .append('label')
            .text('Filter Similar')
            .attr('for', HTMLConstants.CHECKBOX_INPUT_ID)
            .attr('class', HTMLConstants.CHECKBOX_LABEL_CLASS);

        const resetButton = document.createElement('button');
        resetButton.className = HTMLConstants.BUTTON_CLASS;
        resetButton.textContent = 'Reset Settings';
        resetButton.id = HTMLConstants.RESET_BUTTON_ID;
        buttonContainer.appendChild(resetButton);
        resetButton.onclick = () => {
            this.persistLineupSettings(true);
            delete this.dataView.metadata.objects[SettingsNames.LINEUP_SETTINGS];
            this.clearTarget();
            this.updateView();
        };
        const saveButton = document.createElement('button');
        saveButton.className = HTMLConstants.BUTTON_CLASS;
        saveButton.textContent = 'Save Settings';
        saveButton.id = HTMLConstants.SAVE_BUTTON_ID;
        buttonContainer.appendChild(saveButton);
        saveButton.onclick = () => {
            this.persistLineupSettings();
        };
    }

    private updateLegend(
        categories: LineUp.ICategory[],
        colorMapping: LineUp.ICategoricalColorMappingFunction,
        boxPlotlabel?: string,
        boxPlotColor?: string
    ) {
        const legendContainer = d3.select(this.legendContainer);
        legendContainer.selectAll('*').remove();
        const svg = legendContainer.append('svg').attr('class', 'svg-content');
        let currentX = 20;
        const xPositions = [];
        const legendEnter = svg.selectAll('legendText').data(categories).enter();
        legendEnter
            .append('text')
            .text((d) => d.name)
            .attr('text-anchor', 'left')
            .attr('x', function () {
                const x = currentX + LayoutConstants.LEGEND_ITEM_MARGIN;
                xPositions.push(x);
                currentX = x + this.getBoundingClientRect().width + LayoutConstants.LEGEND_TEXT_INDENT;
                return x + LayoutConstants.LEGEND_TEXT_INDENT;
            })
            .attr('y', function () {
                return LayoutConstants.BOTTOM_DIV_HEIGHT / 2 + this.clientHeight;
            });
        legendEnter
            .append('circle')
            .attr('cx', function (d, i) {
                return xPositions[i];
            })
            .attr('cy', LayoutConstants.BOTTOM_DIV_HEIGHT / 2)
            .attr('r', LayoutConstants.LEGEND_CIRCLE_RADIUS)
            .style('fill', function (d) {
                return colorMapping.apply(d);
            });

        if (boxPlotlabel && boxPlotColor) {
            currentX += LayoutConstants.LEGEND_ITEM_MARGIN;
            const boxPlotWidth = 2 * LayoutConstants.LEGEND_CIRCLE_RADIUS + 2 * LayoutConstants.LEGEND_ITEM_MARGIN;
            svg.selectAll('boxPlotMainLine')
                .data([
                    [currentX, currentX + boxPlotWidth / 4],
                    [currentX + (3 * boxPlotWidth) / 4, currentX + boxPlotWidth],
                ])
                .enter()
                .append('line')
                .attr('x1', (d) => d[0])
                .attr('y1', LayoutConstants.BOTTOM_DIV_HEIGHT / 2)
                .attr('x2', (d) => d[1])
                .attr('y2', LayoutConstants.BOTTOM_DIV_HEIGHT / 2)
                .attr('stroke', 'black');

            svg.append('rect')
                .attr('x', function () {
                    return currentX + boxPlotWidth / 4;
                })
                .attr('y', LayoutConstants.BOTTOM_DIV_HEIGHT / 2 - LayoutConstants.LEGEND_CIRCLE_RADIUS)
                .attr('width', boxPlotWidth / 2)
                .attr('height', LayoutConstants.LEGEND_CIRCLE_RADIUS * 2)
                .style('fill', boxPlotColor)
                .attr('stroke', 'black')
                .style('opacity', Constants.BOXPLOT_OPACITY);

            svg.selectAll('boxPlotLines')
                .data([currentX, currentX + boxPlotWidth, currentX + boxPlotWidth / 2])
                .enter()
                .append('line')
                .attr('x1', (x) => x)
                .attr('y1', LayoutConstants.BOTTOM_DIV_HEIGHT / 2 - LayoutConstants.LEGEND_CIRCLE_RADIUS)
                .attr('x2', (x) => x)
                .attr('y2', LayoutConstants.BOTTOM_DIV_HEIGHT / 2 + LayoutConstants.LEGEND_CIRCLE_RADIUS)
                .attr('stroke', 'black');
            currentX += boxPlotWidth;
            svg.append('text')
                .text(boxPlotlabel)
                .attr('text-anchor', 'left')
                .attr('x', currentX + LayoutConstants.LEGEND_TEXT_INDENT)
                .attr('y', function () {
                    return LayoutConstants.BOTTOM_DIV_HEIGHT / 2 + this.clientHeight;
                });
        }
    }

    private calculateZoom() {
        const mainDiv = d3.select(this.mainDiv);

        if (!this.formattingSettings.zoomingCard.zoomingEnabled.value) {
            d3.select(this.lineUpTarget).style('height', `${this.target.clientHeight - LayoutConstants.BOTTOM_DIV_HEIGHT}px`);
            mainDiv.attr('style', `zoom: 1; height: ${100}vh`);
            return;
        }
        const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
        const header = mainDiv.select('article.le-thead');
        const sidePanel = mainDiv.select('aside.lu-side-panel');
        const mainDivNode = mainDiv.node();
        const headerNode = <HTMLElement>header.node();
        const sidePanelNode = <HTMLElement>sidePanel.node();
        const mainWidth = mainDivNode.getBoundingClientRect().width;
        const headerWidth = headerNode.getBoundingClientRect().width;
        const sidePanelWidth = sidePanelNode.getBoundingClientRect().width;
        const zoomMargin = isFirefox ? 0 : 20;
        const zoom = Math.max(
            this.formattingSettings.zoomingCard.minZoomingScale.value,
            Math.min(
                ((mainWidth - zoomMargin) / (headerWidth + sidePanelWidth)) * this.currentZoom,
                this.formattingSettings.zoomingCard.maxZoomingScale.value
            )
        );

        const heightPercentage = ((this.target.clientHeight - LayoutConstants.BOTTOM_DIV_HEIGHT * zoom) / this.target.clientHeight) * 100;
        d3.select(this.lineUpTarget).style('height', `${heightPercentage / zoom}vh`);

        mainDiv.attr(
            'style',
            `zoom: ${zoom}; height: ${100 / zoom}vh; ` +
                (isFirefox ? `-moz-transform: scale(${zoom}); -moz-transform-origin: 0 0; width: ${100 / zoom}%;` : '')
        );
        this.currentZoom = zoom;
    }

    private applyFilter(filter: pbimodels.IFilter) {
        this.host.applyJsonFilter(filter, 'general', 'filter', powerbi.FilterAction.merge);
        this.setFilter = true;
    }

    private buildLineupEventColumn() {
        if (this.viewModel.eventColumns.length > 0) {
            this.builder.column(
                LineUp.buildEventColumn('Events')
                    .label('Events')
                    .eventScaleBounds(
                        this.formattingSettings.eventCard.eventScaleMin.value,
                        this.formattingSettings.eventCard.eventScaleMax.value
                    )
                    .sortEvent(this.viewModel.globalSettings.eventSettings.sortEvent)
                    .boxplotPossible(this.viewModel.similarDataDurationColumn != null)
                    .boxplotUnit(
                        LineUp.ETimeUnit[this.formattingSettings.eventCard.boxplotUnit.value.value],
                        this.formattingSettings.eventCard.msPerBoxplotUnit.value
                    )
                    .eventScaleUnit(
                        LineUp.ETimeUnit[this.formattingSettings.eventCard.eventUnit.value.value],
                        this.formattingSettings.eventCard.msPerEventUnit.value
                    )
                    .heatmapBinCount(this.formattingSettings.eventCard.heatmapBinCount.value)
                    .legendUpdateCallback(this.updateLegend.bind(this))
                    .width(LayoutConstants.EVENT_COLUMN_WIDTH)
                    .customTooltip(this.tooltipUpdateCallback.bind(this))
            );
        }
    }

    private tooltipUpdateCallback(tooltipData: LineUp.ITooltipRow[]) {
        const formatter = (x) => valueFormatter.format(x, '0.#####');
        const tooltipList = tooltipData.map((row) => {
            return {
                displayName: row.eventName,
                value: formatter(row.value),
                color: row.color,
            } as powerbi.extensibility.VisualTooltipDataItem;
        });
        this.tooltipServiceWrapper.addTooltip(
            d3.select(this.target).selectAll('.lu-detail > .svg-content'),
            () => tooltipList,
            () => null
        );
    }

    private dialogContext(ctx: LineUp.IRankingHeaderContext, level: number, attachment: HTMLElement | MouseEvent): LineUp.IDialogContext {
        return {
            attachment:
                (attachment as MouseEvent).currentTarget != null
                    ? ((attachment as MouseEvent).currentTarget as HTMLElement)
                    : (attachment as HTMLElement),
            level,
            manager: ctx.dialogManager,
            idPrefix: ctx.idPrefix,
            sanitize: ctx.sanitize,
        };
    }

    private buildLineupDataColumns() {
        const customMappings = this.getCustomMappings();
        for (const column of this.viewModel.columnData) {
            const filteredMapping = customMappings.filter((x) => x.columnKey === column.name.toLowerCase());
            let lineupColumn;
            switch (column.columnType) {
                case 'categoricalColumn':
                    lineupColumn = LineUp.buildCategoricalColumn(column.name).width(LayoutConstants.CATEGORICAL_COLUMN_WIDTH);
                    break;
                case 'numberColumn':
                    if (filteredMapping.length > 0 && filteredMapping[0].min !== undefined && filteredMapping[0].max !== undefined) {
                        lineupColumn = LineUp.buildNumberColumn(column.name, [filteredMapping[0].min, filteredMapping[0].max]);
                    } else {
                        lineupColumn = LineUp.buildNumberColumn(column.name);
                    }
                    break;
                case 'dateColumn':
                    lineupColumn = LineUp.buildDateColumn(column.name)
                        .format(Constants.dateFormat, '%Y-%m-%dT%H:%M:%S.%LZ')
                        .width(LayoutConstants.DATE_COLUMN_WIDTH);
                    break;
                case 'booleanColumn':
                    lineupColumn = LineUp.buildBooleanColumn(column.name).width(LayoutConstants.CATEGORICAL_COLUMN_WIDTH);
                    break;
                default:
                    this.setErrorMessage(ErrorMessages.UNKNOWN_COLUMN_TYPE_ERROR + ` ${column.name} ${column.columnType}`);
                    throw new BaseError(ErrorMessages.UNKNOWN_COLUMN_TYPE_ERROR, {
                        context: { name: column.source.displayName, queryName: column.source.queryName },
                    });
            }
            this.builder.column(lineupColumn);
        }
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    getVisualUpdateType = (type: VisualUpdateType) => {
        return {
            data: VisualUpdateType.Data === (type & VisualUpdateType.Data),
            resize: VisualUpdateType.Resize === (type & VisualUpdateType.Resize),
            resizeEnd: VisualUpdateType.ResizeEnd === (type & VisualUpdateType.ResizeEnd),
            viewMode: VisualUpdateType.ViewMode === (type & VisualUpdateType.ViewMode),
            style: VisualUpdateType.Style === (type & VisualUpdateType.Style),
            all: VisualUpdateType.All === (type & VisualUpdateType.All),
        };
    };
}
