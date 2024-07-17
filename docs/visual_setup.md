# Visual Setup

This document describes how to set up the Event Table Viewer visual in Power BI.

## Data Input Fields

The Event Table Viewer visual consists of five different data input fields. It is mandatory to provide data for at least one of the fields `Data Columns` and `Event Data`.

![Data Input Fields](./files/visual_setup/data%20fields.png)

### Data Columns

This field supports the following data types:

-   String
-   Number
-   Date/Time
-   Boolean

All fields are displayed as column of the corresponding type in the table and have different visual representations and filter options depending on the type. For example the table can be grouped by individual string values, but number values have to be binned for grouping.

### Event Data

Data fields added here must be of type `Date/Time`. Hierarchical dates are not supported. Each data field added will be displayed as one event type with a unique color in the event column.

### Similar Data IDs

The input field `Similar Data IDs` is used to filter data from different tables that can be unrelated to the current data. When multiple IDs are provided they must be separated by `;` in order to be recognized by the visual. The table to be filtered can be specified in the visual settings.

### Similar Data Duration

This field is used to specify the boxplot values for each rows as offset from the event. The unit of the duration can be specified in the visual settings. Values are separated by `;`.

```title="Example"
15;20;14;14;10;10;13;11;9;5;8;13;2;9;6;7;3;5;3;6;15;16;14;5;10;16;23;10;4;11;17;6;8;14
```

### ID

The data provided here must be a unique ID and is used to save selected data rows between Power BI reloads.

## Power BI Settings

### Data Reduction Settings

Setting the `Row Count` in data reduction settings will change the number of data rows loaded in one batch when the data is updated. This can be used to optimize the performance of the visual.

![Data Reduction Settings](./files/visual_setup/data%20reduction%20settings.png)

### Event Settings

The event settings contain everything that is relevant to the event column.

![Event Settings](./files/visual_setup/event%20settings.png)

#### Event unit

Time unit for the event scale. It is displayed in brackets next to the event column name.

Possible values:

| Unit   | Description                                             |
| ------ | ------------------------------------------------------- |
| ms     | milliseconds                                            |
| s      | seconds                                                 |
| min    | minutes                                                 |
| h      | hours                                                   |
| D      | days                                                    |
| W      | weeks                                                   |
| M      | months                                                  |
| Y      | years                                                   |
| custom | custom unit defined under `Milliseconds per Scale Unit` |

#### Milliseconds per Scale Unit

Custom unit for the event scale. Only used when `Event unit` is set to `custom`.

#### Boxplot Unit

Specifies the time unit of the data provided in the `Similar Data Duration` field.
Possible values are the same as for the `Event unit`.

#### Milliseconds per Boxplot Unit

Custom unit for the boxplot scale. Only used when `Boxplot Unit` is set to `custom`.

#### Event Scale Min

Minimum value of the event scale. Only used when the data exceeds that range. Otherwise, the minimum value of the data is used.
Unit is the same as for the `Event unit`.
Default value is `-100`.

#### Event Scale Max

Maximum value of the event scale. Only used when the data exceeds that range. Otherwise, the maximum value of the data is used.
Unit is the same as for the `Event unit`.
Default value is `365`.

#### Heatmap Bin Count

Number of bins for the heatmap in the event overview.
Default value is `50`.

### Filter Settings

The filter settings are used when the checkbox `Filter Similar` is checked in the visual footer. `Similar Data IDs` must be provided in the data input fields. When active, the visual will filter the data based on the provided IDs and the table and column specified in the filter settings.

![Filter Settings](./files/visual_setup/filter%20settings.png)

#### Filter Similar Default

Default value for the `Filter Similar` checkbox.

#### Similar ID Table

Table name to be filtered when the `Filter Similar` checkbox is checked.

#### Similar ID Column

Column name to be filtered when the `Filter Similar` checkbox is checked.

### General Settings

The general settings contain the table aggregation strategy and custom numerical mappings.

![General Settings](./files/visual_setup/general%20settings.png)

#### Aggregation strategy

The aggregation strategy defines how the table is displayed on grouping.

Group means a group summary visualization like a boxplot or histogram. Items are the individual table rows. Top are the top N items of one group. N can be set by clicking on the 3 dots in the aggregation column (left most column).

| Name         | Description                                        |
| ------------ | -------------------------------------------------- |
| group        | shows group summary only                           |
| item         | shows items only                                   |
| groupItem    | shows group summary and items                      |
| groupTopItem | shows group and top N items, items can be expanded |
| groupItemTop | shows group and all items, items can be collapsed  |

#### Custom mapping

This setting is used to specify a custom numeric column range mapping. The default is to use the minimum and maximum values of each column as range.
The custom mapping is specified in JSON format: `{"ColumnName":[min,max]} `

#### Zooming settings

Adapts the visual zoom such that the columns fit the available space.

![Zooming Settings](./files/visual_setup/zooming%20settings.png)

Zooming can be disabled. The default values are `true` for enabling zooming, `0.5` for `Min Zooming Scale` and `1` for `Max Zooming Scale`.

## Saving the visual state

When changing the visual appearence through the table itsself, this is not saved between Power BI reloads. To save the current state of the visual, the `Save Settings` button at the bottom right of the visual can be used. This is only possible when the Power BI report is in edit mode.

Examples for saved settings are:

-   Column order
-   Column width
-   Filters
-   Color mappings
-   Grouping
-   Sorting

To reset the visual to the default state, the `Reset Settings` button can be used.

More information about the visual can be found in the [User Guide](./user_guide.md).
