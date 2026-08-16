export const AppContribution = Symbol('AppContribution');

export type AppContributionArea = 'shell' | 'full';

export interface AppContribution {
    readonly id: string;
    readonly label: string;
    readonly iconClass?: string;
    readonly area?: AppContributionArea;
    activate?(): void;
}
