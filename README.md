# Event Table Viewer Power BI Visual

Custom Visual for Power BI displaying event data in an extended version of [LineUp.js](https://lineup.js.org/).
The extended version including the event column is avaiable [here](https://github.com/jzethofer/lineupjs/tree/build) as a fork of [LineUp](https://github.com/lineupjs/lineupjs).

![Event Table Viewer](./publication/final/Screenshot1.png)

## Key Features

-   **Data Table**
    -   displaying categorical, numerical, or temporal data in LineUp.js
-   **Custom event data column**
    -   Show events for each data row on a shared time scale
    -   Interactive time scale: Zoom and drag functionality
    -   Event types legend
    -   Box plot: Visualize the spread of a future event based on similar observed data
    -   Events in LineUp overview mode: tiny rectangles provide a compact view of events
    -   Event reference column for comparing events that occured at different points in time
    -   Heatmap summary visualization to compare distribution of events
    -   Tooltips showing exact time scale values of events and box plot
    -   Settings for event column
        -   Sorting by events and box plot values
        -   Event colors
        -   Toggle which events and box plot values are displayed in normal and overview mode
        -   Setting reference events for time scale and box plot
-   Filtering other visuals based on similar data IDs of selected rows
-   Filtering other visuals based on selected row ID
-   Save button for keeping LineUp state (filters, sorting, column order, ...) between Power BI reloads
-   Power BI Settings
    -   Filter Settings (Table and column ID to be filtered)
    -   Event Settings
        -   Event scale units
            -   year, month, week, day, hour, minute, second, millisecond
            -   custom unit defined in milliseconds
        -   Minimum and maximum of event scale
            -   Only used when the data exceeds that range
        -   Heatmap bin count for event overview
    -   General Settings
        -   LineUp aggregation strategy
            -   group (shows group summary only)
            -   item (shows items only)
            -   groupItem (shows group summary and items)
            -   groupTopItem (shows group and top N items, items can be expanded to show all items)
            -   groupItemTop (shows group and all items, items can be collapsed to show top N items)
        -   Custom numeric column range mappings
            -   default is to use the minimum and maximum values of each column as range
            -   specified in JSON format: `{"ColumnName":[min,max]} `
    -   Zooming settings
        -   Adapts the visual zoom such that the columns fit the available space
        -   Can be disabled
        -   Minimum and maximum zoom scale
