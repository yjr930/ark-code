import { injectable } from '@theia/core/shared/inversify';
import { AppContribution } from './app-bar-contribution';

@injectable()
export class EditorApp implements AppContribution {
    readonly id = 'editor';
    readonly label = 'Editor';
    readonly iconClass = 'codicon codicon-files';
    readonly area = 'shell';
}

@injectable()
export class GitApp implements AppContribution {
    readonly id = 'git';
    readonly label = 'Git';
    readonly iconClass = 'codicon codicon-source-control';
}

@injectable()
export class AiChatApp implements AppContribution {
    readonly id = 'agents';
    readonly label = 'Agents';
    readonly iconClass = 'codicon codicon-comment-discussion';
    readonly area = 'full';
}

@injectable()
export class TerminalApp implements AppContribution {
    readonly id = 'terminal';
    readonly label = 'Terminal';
    readonly iconClass = 'codicon codicon-terminal';
}

@injectable()
export class BrowserApp implements AppContribution {
    readonly id = 'browser';
    readonly label = 'Browser';
    readonly iconClass = 'codicon codicon-globe';
}
