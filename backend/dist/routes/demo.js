"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoRouter = void 0;
const express_1 = require("express");
exports.demoRouter = (0, express_1.Router)();
const SCENARIOS = [
    {
        id: 'A',
        label: 'Same-side pitstop',
        description: 'A well-placed roadside dhaba with excellent access directly on the travel lane — zero crossing required.',
        badge: 'Access confirmed',
        source: 'Mumbai, Maharashtra',
        destination: 'Pune, Maharashtra',
        preferenceHint: 'meal=lunch',
    },
    {
        id: 'B',
        label: 'Efficiency ranking',
        description: 'Multiple stops ranked by our 5-component efficiency score — see how detour, direction and timing combine.',
        badge: 'Score comparison',
        source: 'Panvel, Navi Mumbai',
        destination: 'Lonavala, Maharashtra',
        preferenceHint: 'meal=any',
    },
    {
        id: 'C',
        label: 'ETA & meal window',
        description: 'Departure timed so pitstop arrival falls exactly in the lunch window — see meal availability assessment.',
        badge: 'ETA-aware',
        source: 'Khopoli, Maharashtra',
        destination: 'Pune, Maharashtra',
        preferenceHint: 'meal=lunch',
    },
    {
        id: 'D',
        label: 'Vegetarian filter',
        description: 'Route filtered for fully-vegetarian establishments, with cuisine and price-level constraints applied.',
        badge: 'Veg only',
        source: 'Navi Mumbai',
        destination: 'Pune, Maharashtra',
        preferenceHint: 'vegetarianOnly=true',
    },
    {
        id: 'E',
        label: 'Bangalore–Mysore highway',
        description: 'Demonstrates algorithm on a different corridor — NH275, Southern India corridor.',
        badge: 'NH275',
        source: 'Bangalore, Karnataka',
        destination: 'Mysore, Karnataka',
        preferenceHint: 'meal=any',
    },
];
// GET /api/demo/scenarios
exports.demoRouter.get('/scenarios', (_req, res) => {
    res.json({ data: SCENARIOS, total: SCENARIOS.length });
});
// GET /api/demo/scenarios/:id
exports.demoRouter.get('/scenarios/:id', (req, res) => {
    const scenario = SCENARIOS.find(s => s.id === req.params.id.toUpperCase());
    if (!scenario) {
        res.status(404).json({ error: 'Scenario not found', code: 'NOT_FOUND' });
        return;
    }
    res.json({ data: scenario });
});
//# sourceMappingURL=demo.js.map