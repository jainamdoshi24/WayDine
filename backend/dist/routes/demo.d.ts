export declare const demoRouter: import("express-serve-static-core").Router;
/**
 * Demo scenarios for judges / presentations.
 * Each scenario provides a preset source, destination, and description
 * so the frontend can load it with one click.
 */
export interface DemoScenario {
    id: string;
    label: string;
    description: string;
    badge: string;
    source: string;
    destination: string;
    preferenceHint?: string;
}
//# sourceMappingURL=demo.d.ts.map