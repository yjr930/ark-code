import * as React from '@theia/core/shared/react';
import { ContributionProvider } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, named, postConstruct } from '@theia/core/shared/inversify';
import { AppContribution } from './app-bar-contribution';
import { AppBarService } from './app-bar-service';

export const AppBarWidgetFactory = Symbol('AppBarWidgetFactory');
export type AppBarWidgetFactory = () => AppBarWidget;

@injectable()
export class AppBarWidget extends ReactWidget {
    static readonly ID = 'arkcode-app-bar';

    @inject(ContributionProvider) @named(AppContribution)
    protected readonly apps: ContributionProvider<AppContribution>;

    @inject(AppBarService)
    protected readonly appBarService: AppBarService;

    constructor() {
        super();
        this.id = AppBarWidget.ID;
        this.addClass('arkcode-app-bar');
    }

    @postConstruct()
    protected init(): void {
        const apps = this.apps.getContributions();
        if (!this.appBarService.currentApp && apps.length > 0) {
            this.appBarService.setCurrentApp(apps[0]);
        }
        this.appBarService.onDidChangeCurrentApp(() => this.update());
    }

    protected override render(): React.ReactNode {
        const apps = this.apps.getContributions();
        const currentAppId = this.appBarService.currentApp?.id;
        return (
            <div className='arkcode-app-bar-content'>
                {apps.map(app => (
                    <button
                        key={app.id}
                        type='button'
                        className={`arkcode-app-bar-item${app.id === currentAppId ? ' active' : ''}`}
                        title={app.label}
                        onClick={() => this.appBarService.setCurrentApp(app)}
                    >
                        {app.iconClass ? <i className={app.iconClass} aria-hidden='true' /> : undefined}
                        <span>{app.label}</span>
                    </button>
                ))}
            </div>
        );
    }
}
