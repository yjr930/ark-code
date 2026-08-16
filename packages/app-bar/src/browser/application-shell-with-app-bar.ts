import { ApplicationShell, Layout, TheiaSplitPanel } from '@theia/core/lib/browser';
import { Panel } from '@theia/core/shared/@lumino/widgets';
import { inject, injectable, interfaces, postConstruct } from '@theia/core/shared/inversify';
import { AppBarWidget, AppBarWidgetFactory } from './app-bar-widget';
import { AppBarService } from './app-bar-service';
import { AppHostWidget } from './app-host-widget';

@injectable()
export class ApplicationShellWithAppBar extends ApplicationShell {
    @inject(AppBarWidgetFactory)
    protected readonly appBarFactory: AppBarWidgetFactory;

    @inject(AppBarService)
    protected readonly appBarService: AppBarService;

    @inject(AppHostWidget)
    protected readonly appHostWidget: AppHostWidget;

    protected appBar: AppBarWidget;
    protected panelForSideAreas: TheiaSplitPanel;
    protected editorMenuPanel: Panel;

    @postConstruct()
    protected override init(): void {
        this.appBar = this.appBarFactory();
        this.appBar.id = AppBarWidget.ID;
        this.editorMenuPanel = new Panel();
        this.editorMenuPanel.id = 'arkcode-editor-menu-panel';
        this.editorMenuPanel.addClass('arkcode-editor-menu-panel');
        super.init();
        this.topPanel.addWidget(this.appBar);
        this.updateAppAreaVisibility(this.appBarService.currentApp);
        this.appBarService.onDidChangeCurrentApp(app => this.updateAppAreaVisibility(app));
        this.appBar.update();
        this.appHostWidget.update();
    }

    protected override createLayout(): Layout {
        const bottomSplitLayout = this.createSplitLayout(
            [this.mainPanel, this.bottomPanel],
            [1, 0],
            { orientation: 'vertical', spacing: 0 }
        );
        const panelForBottomArea = new TheiaSplitPanel({ layout: bottomSplitLayout });
        panelForBottomArea.id = 'theia-bottom-split-panel';

        const leftRightSplitLayout = this.createSplitLayout(
            [this.leftPanelHandler.container, panelForBottomArea, this.rightPanelHandler.container],
            [0, 1, 0],
            { orientation: 'horizontal', spacing: 0 }
        );
        const panelForSideAreas = new TheiaSplitPanel({ layout: leftRightSplitLayout });
        panelForSideAreas.id = 'theia-left-right-split-panel';
        this.panelForSideAreas = panelForSideAreas;

        return this.createBoxLayout(
            [this.topPanel, this.editorMenuPanel, this.appHostWidget, panelForSideAreas, this.statusBar],
            [0, 0, 1, 1, 0],
            { direction: 'top-to-bottom', spacing: 0 }
        );
    }

    protected updateAppAreaVisibility(app: { area?: 'shell' | 'full' } | undefined): void {
        const showOriginalShell = !app || app.area === 'shell';
        this.editorMenuPanel.setHidden(!showOriginalShell);
        this.appHostWidget.setHidden(showOriginalShell);
        this.panelForSideAreas.setHidden(!showOriginalShell);
    }

    getEditorMenuPanel(): Panel {
        return this.editorMenuPanel;
    }
}

export const bindAppBarApplicationShell = (bind: interfaces.Bind, rebind: interfaces.Rebind): void => {
    bind(ApplicationShellWithAppBar).toSelf().inSingletonScope();
    rebind(ApplicationShell).toService(ApplicationShellWithAppBar);
};
