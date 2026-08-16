import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { AppContribution } from './app-bar-contribution';

@injectable()
export class AppBarService {
    protected readonly onDidChangeCurrentAppEmitter = new Emitter<AppContribution | undefined>();
    readonly onDidChangeCurrentApp = this.onDidChangeCurrentAppEmitter.event;

    protected current: AppContribution | undefined;

    get currentApp(): AppContribution | undefined {
        return this.current;
    }

    setCurrentApp(app: AppContribution | undefined): void {
        if (this.current === app) {
            return;
        }
        this.current = app;
        app?.activate?.();
        this.onDidChangeCurrentAppEmitter.fire(app);
    }
}
