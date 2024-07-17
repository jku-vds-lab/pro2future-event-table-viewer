export class ColumnNames {
    public static readonly DATA_COLUMNS: string = 'dataColumns';
    public static readonly EVENT_DATA_COLUMNS: string = 'eventData';
    public static readonly SIMILAR_DATA_IDS_COLUMN: string = 'similarDataIds';
    public static readonly SIMILAR_DATA_DURATION_COLUMN: string = 'similarDataDuration';
    public static readonly EVENTS_COLUMN_NAME = 'Events';
    public static readonly ID_COLUMN_NAME = 'dataID';
    public static readonly LINEUP_EVENT_COLUMN_NAME = 'EventColumn';
}

export class LayoutConstants {
    static readonly EVENT_COLUMN_WIDTH = 500;
    static readonly DATE_COLUMN_WIDTH = 80;
    static readonly CATEGORICAL_COLUMN_WIDTH = 100;

    static readonly LEGEND_TEXT_INDENT = 10;
    static readonly BOTTOM_DIV_HEIGHT = 30;
    static readonly LEGEND_ITEM_MARGIN = 20;
    static readonly LEGEND_CIRCLE_RADIUS = 7;
}

export class SettingsNames {
    static readonly LINEUP_SETTINGS = 'lineupSettings';
    static readonly LINEUP_JSON_DUMP = 'jsondump';
    static readonly SHOW_SIDE_PANEL = 'showSidePanel';
    static readonly OVERVIEW_MODE = 'overviewMode';
}

export class Constants {
    static readonly dateFormat = '%d.%m.%y';
    static readonly DISPLAY_EVENT_LIST = 'displayEventList';
    static readonly BOXPLOT_DEFAULT_COLOR = '#ffff33';
    static readonly BOXPLOT_OPACITY = 0.7;
}

export class HTMLConstants {
    static readonly SAVE_BUTTON_ID = 'SaveButton';
    static readonly RESET_BUTTON_ID = 'ResetButton';
    static readonly BUTTON_CLASS = 'footer-button';
    static readonly BUTTON_CONTAINER_CLASS = 'footer-button-container';
    static readonly FOOTER_CLASS = 'footer';
    static readonly FOOTER_LEGEND_CONTAINER_CLASS = 'footer-legend-container';
    static readonly FILTER_DIV_ID = 'filterDiv';
    static readonly CHECKBOX_LABEL_CLASS = 'checkbox-label';
    static readonly CHECKBOX_INPUT_ID = 'filterInput';
}
