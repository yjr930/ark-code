import { bindRootContributionProvider } from '@theia/core';
import { ApplicationShell } from '@theia/core/lib/browser';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { AppBarWidget, AppBarWidgetFactory } from './app-bar-widget';
import { AppContribution } from './app-bar-contribution';
import { AiChatApp, BrowserApp, EditorApp, GitApp, TerminalApp } from './builtin-apps';
import { bindAppBarApplicationShell } from './application-shell-with-app-bar';
import { AppBarService } from './app-bar-service';
import { AppHostWidget } from './app-host-widget';
import '../../src/browser/style/app-bar.css';

export default new ContainerModule((
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind,
) => {
    bind(AppBarWidget).toSelf().inSingletonScope();
    bind(AppBarWidgetFactory).toFactory(({ container }) => (): AppBarWidget => container.get(AppBarWidget));
    bind(AppBarService).toSelf().inSingletonScope();
    bind(AppHostWidget).toSelf().inSingletonScope();
    bindRootContributionProvider(bind, AppContribution);

    bind(AppContribution).to(EditorApp).inSingletonScope();
    bind(AppContribution).to(GitApp).inSingletonScope();
    bind(AppContribution).to(AiChatApp).inSingletonScope();
    bind(AppContribution).to(TerminalApp).inSingletonScope();
    bind(AppContribution).to(BrowserApp).inSingletonScope();

    bindAppBarApplicationShell(bind, rebind);
});
