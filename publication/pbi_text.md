# Event Table Viewer

Event Table Viewer is a visualization for analyzing event data along with categorical and numerical data columns in a tabular layout. A detailed documentation can be found here: https://jku-vds-lab.at/pro2future-event-table-viewer/

The table shows data in a tabular format to allow for easy comparison of individual rows and of grouped data. There are 5 supported column types: events, categories (string), numbers, dates, and boolean.

Events are displayed as colored dots depending on their event type. An event legend is displayed at the bottom left of the visual. They are displayed on a shared time scale (drawn in the column header) that can be zoomed and dragged. The time scale can be set to a specific unit (days in the example). A reference event can be set that all events are drawn relative to for easier comparison. The boxplot shows additional information like the event distribution of similar data. Events can be sorted by one event type or any of the boxplot values.

Colors and visualization can be changed for each column by clicking on the 3 dots in the respective header. For example a numeric cell value can be displayed through bars, brightness, or tick. A numeric summary can be displayed as a boxplot, histogram, or violin plot.

Rows can be grouped by all columns except for the event column. Each group is indicated by a black bar on the left side of the table and can be expanded to show all rows in the group. Group headers show the number of rows in the group and a summary visualization per column. For example events are shown as a heatmap, numbers as a boxplot, and categories as a bar chart.

In the panel on the right shows grouping and sorting hierarchy as well as a summary for each column. When adding a second sorting column, rows are sorted by the second column when the first column has the same value. The summary can also be used to filter the table by selecting a range of numeric values or clicking on a category to deselect it.

The dashboard on the next page shows goods of two warehouses (N and S) with different production events (A, B, C, D and shipping date).
The visual on the top displays the events on a time scale with unit day. Event B is unknown and can be estimated by the boxplots that shows the distribution of event B for similar data from the past. By selecting a row, similar the similar data is displayed in the bottom visual. The bottom visual shows the data in overview mode, which allows to view as many rows as pixels are available.
