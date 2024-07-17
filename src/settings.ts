/*
 *  Power BI Visualizations
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

import * as LineUp from 'lineup-eventdata';

import { formattingSettings } from 'powerbi-visuals-utils-formattingmodel';
import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import { LineUpAggregationStrategies } from './ViewModelInterfaces';

class EventSettings extends FormattingSettingsCard {
    eventUnit = new formattingSettings.ItemDropdown({
        name: 'eventUnit',
        displayName: 'Event Unit',
        description: 'Sets the unit of the event scale. Default is day. When setting to custom, the msPerEventUnit is used.',
        items: Object.keys(LineUp.ETimeUnit).map((k) => <powerbi.IEnumMember>{ value: LineUp.ETimeUnit[k], displayName: k }),
        value: { value: LineUp.ETimeUnit.D, displayName: LineUp.ETimeUnit.D },
    });

    msPerEventUnit = new formattingSettings.NumUpDown({
        name: 'msPerEventUnit',
        displayName: 'Milliseconds per Scale Unit',
        description: 'Sets the amount of milliseconds that all events are devided through. Default is 1 day.',
        value: 1000 * 60 * 60 * 24,
    });

    boxplotUnit = new formattingSettings.ItemDropdown({
        name: 'boxplotUnit',
        displayName: 'Boxplot Unit',
        description: 'Sets the unit of the boxplot scale. Default is day. When setting to custom, the msPerBoxplotUnit is used.',
        items: Object.keys(LineUp.ETimeUnit).map((k) => <powerbi.IEnumMember>{ value: LineUp.ETimeUnit[k], displayName: k }),
        value: { value: LineUp.ETimeUnit.D, displayName: LineUp.ETimeUnit.D },
    });

    msPerBoxplotUnit = new formattingSettings.NumUpDown({
        name: 'msPerBoxplotUnit',
        displayName: 'Milliseconds per Boxplot Unit',
        description: 'Sets the amount of milliseconds that all boxplot values are devided through. Default is 1 day.',
        value: 1000 * 60 * 60 * 24,
    });

    eventScaleMin = new formattingSettings.NumUpDown({
        name: 'eventScaleMin',
        displayName: 'Event Scale Min',
        description: 'Sets the minimum scale unit for the event scale before zooming. Default is -100 units.',
        value: -100,
    });

    eventScaleMax = new formattingSettings.NumUpDown({
        name: 'eventScaleMax',
        displayName: 'Event Scale Max',
        description: 'Sets the maximum scale unit for the event scale before zooming. Default is 365 units.',
        value: 365,
    });
    heatmapBinCount = new formattingSettings.NumUpDown({
        name: 'heatmapBinCount',
        displayName: 'Heatmap Bin Count',
        description:
            'Sets the approximate amount of bins that are used for the heatmap. Real bin count is set in a way that bin ranges are integers. Default is 50.',
        value: 50,
    });

    name: string = 'eventSettings';
    displayName: string = 'Event Settings';
    slices: Array<FormattingSettingsSlice> = [
        this.eventUnit,
        this.msPerEventUnit,
        this.boxplotUnit,
        this.msPerBoxplotUnit,
        this.eventScaleMin,
        this.eventScaleMax,
        this.heatmapBinCount,
    ];
}

class FilterSettings extends FormattingSettingsCard {
    filterSimilarDefault = new formattingSettings.ToggleSwitch({
        name: 'filterSimilarDefault',
        displayName: 'Filter Similar Default',
        description: 'Enables filtering of similar items on visual load. Default is false.',
        value: false,
    });

    similarIDTable = new formattingSettings.TextInput({
        name: 'similarIDTable',
        displayName: 'Similar ID Table',
        value: '',
        placeholder: 'Similar ID Table Name',
    });

    similarIDColumn = new formattingSettings.TextInput({
        name: 'similarIDColumn',
        displayName: 'Similar ID Column',
        value: '',
        placeholder: 'Similar ID Column Name',
    });

    name: string = 'filterSettings';
    displayName?: string = 'Filter Settings';
    slices: Array<FormattingSettingsSlice> = [this.filterSimilarDefault, this.similarIDTable, this.similarIDColumn];
}

class LineUpSettings extends FormattingSettingsCard {
    aggregationStrategy = new formattingSettings.ItemDropdown({
        name: 'aggregationStrategy',
        displayName: 'Aggregation Strategy',
        items: Object.keys(LineUpAggregationStrategies).map(
            (key) => <powerbi.IEnumMember>{ value: LineUpAggregationStrategies[key], displayName: key }
        ),
        value: { value: LineUpAggregationStrategies.group, displayName: LineUpAggregationStrategies.group },
        //value: LineUpAggregationStrategies.group as IAggregationStrategy,

        //
    });

    customMapping = new formattingSettings.TextInput({
        name: 'customMapping',
        displayName: 'Custom Mapping',
        description: 'Sets a custom mapping for specific numerical columns in JSON format. Example: {"column1": [min,max], "column2": []}',
        value: '{}',
        placeholder: '{}',
    });

    name: string = 'lineUpVisualSettings';
    displayName?: string = 'General Settings';
    slices: Array<FormattingSettingsSlice> = [this.aggregationStrategy, this.customMapping];
}

class DataReductionSettings extends FormattingSettingsCard {
    rowCount = new formattingSettings.NumUpDown({
        name: 'rowCount',
        displayName: 'Row Count',
        description: 'Sets the number of rows that are loaded in one loading step. Default is 20000.',
        value: 20000,
    });

    name: string = 'dataReductionCustomization';
    displayName?: string = 'Data Reduction Settings';
    slices: Array<FormattingSettingsSlice> = [this.rowCount];
}

class ZoomingSettings extends FormattingSettingsCard {
    zoomingEnabled = new formattingSettings.ToggleSwitch({
        name: 'zoomingEnabled',
        displayName: 'Zooming',
        description: 'Enables automatic zooming to fit all columns to the screen.',
        value: true,
    });

    minZoomingScale = new formattingSettings.NumUpDown({
        name: 'minZoomingScale',
        displayName: 'Min Zooming Scale',
        description: 'Sets the minimum zooming scale. Default is 0.5.',
        value: 0.5,
    });

    maxZoomingScale = new formattingSettings.NumUpDown({
        name: 'maxZoomingScale',
        displayName: 'Max Zooming Scale',
        description: 'Sets the maximum zooming scale. Default is 1.',
        value: 1,
    });

    name: string = 'zoomingSettings';
    displayName?: string = 'Zooming Settings';
    slices: Array<FormattingSettingsSlice> = [this.zoomingEnabled, this.minZoomingScale, this.maxZoomingScale];
}

/**
 * visual settings model class
 *
 */
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    filterCard = new FilterSettings();
    eventCard = new EventSettings();
    lineupCard = new LineUpSettings();
    dataReductionCard = new DataReductionSettings();
    zoomingCard = new ZoomingSettings();

    cards = [this.dataReductionCard, this.eventCard, this.filterCard, this.lineupCard, this.zoomingCard];
}
