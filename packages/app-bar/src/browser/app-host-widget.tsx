import * as React from '@theia/core/shared/react';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { AppBarService } from './app-bar-service';

@injectable()
export class AppHostWidget extends ReactWidget {
    static readonly ID = 'arkcode-app-host';

    @inject(AppBarService)
    protected readonly appBarService: AppBarService;

    constructor() {
        super();
        this.id = AppHostWidget.ID;
        this.addClass('arkcode-app-host');
    }

    @postConstruct()
    protected init(): void {
        this.appBarService.onDidChangeCurrentApp(() => this.update());
    }

    protected override render(): React.ReactNode {
        const app = this.appBarService.currentApp;
        if (app?.area === 'shell') {
            return undefined;
        }
        return (
            <div className='arkcode-app-host-content'>
                {app
                    ? (
                        <section className='arkcode-app-host-placeholder'>
                            <h1>{app.label}</h1>
                            <p>This app is registered in the AppBar. Its real content will be connected later.</p>
                        </section>
                    )
                    : (
                        <section className='arkcode-app-host-placeholder'>
                            <h1>No App selected</h1>
                        </section>
                    )}
            </div>
        );
    }
}
