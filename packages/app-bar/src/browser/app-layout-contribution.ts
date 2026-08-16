import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ApplicationShellWithAppBar } from './application-shell-with-app-bar';

@injectable()
export class AppLayoutContribution implements FrontendApplicationContribution {
    @inject(ApplicationShellWithAppBar)
    protected readonly shell: ApplicationShellWithAppBar;

    @inject(ElectronMenuContribution)
    protected readonly electronMenuContribution: ElectronMenuContribution;

    onDidInitializeLayout(_app: FrontendApplication): void {
        window.setTimeout(() => {
            const menuBar = this.electronMenuContribution.menuBar;
            if (menuBar) {
                this.shell.getEditorMenuPanel().addWidget(menuBar);
            }
        }, 0);
    }
}
