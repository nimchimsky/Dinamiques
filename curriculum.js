export const CANONICAL_MODULES = [
    // TIS (Tècnic Superior en Integració Social)
    { code: "MP01", name: "Context de la intervenció social", cycle: "TIS" },
    { code: "MP02", name: "Metodologia de la intervenció social", cycle: "TIS" },
    { code: "MP03", name: "Promoció de l'autonomia personal", cycle: "TIS" },
    { code: "MP04", name: "Inserció sociolaboral", cycle: "TIS" },
    { code: "MP05", name: "Sistemes augmentatius i alternatius de comunicació", cycle: "TIS" },
    { code: "MP06", name: "Atenció a les unitats de convivència", cycle: "TIS" },
    { code: "MP07", name: "Suport a la intervenció educativa", cycle: "TIS" },
    { code: "MP08", name: "Mediació comunitària", cycle: "TIS" },
    { code: "MP09", name: "Habilitats socials", cycle: "TIS" },
    { code: "MP10", name: "Primers auxilis", cycle: "TIS" },
    { code: "MP11", name: "Formació i orientació laboral", cycle: "TIS" },
    { code: "MP12", name: "Empresa i iniciativa emprenedora", cycle: "TIS" },
    { code: "MP13", name: "Projecte d'integració social", cycle: "TIS" },
    { code: "MP14", name: "Formació en centres de treball", cycle: "TIS" },

    // TAPD (Tècnic en Atenció a Persones en Situació de Dependència)
    { code: "MP01", name: "Organització de l'atenció a les persones en situació de dependència", cycle: "TAPD" },
    { code: "MP02", name: "Atenció sanitària", cycle: "TAPD" },
    { code: "MP03", name: "Atenció higiènica", cycle: "TAPD" },
    { code: "MP04", name: "Atenció i suport psicosocial", cycle: "TAPD" },
    { code: "MP05", name: "Característiques i necessitats de les persones en situació de dependència", cycle: "TAPD" },
    { code: "MP06", name: "Teleassistència", cycle: "TAPD" },
    { code: "MP07", name: "Suport domiciliari", cycle: "TAPD" },
    { code: "MP08", name: "Suport a la comunicació", cycle: "TAPD" },
    { code: "MP09", name: "Destreses socials", cycle: "TAPD" },
    { code: "MP10", name: "Primers auxilis", cycle: "TAPD" },
    { code: "MP11", name: "Formació i orientació laboral", cycle: "TAPD" },
    { code: "MP12", name: "Empresa i iniciativa emprenedora", cycle: "TAPD" },
    { code: "MP13", name: "Síntesi", cycle: "TAPD" },
    { code: "MP14", name: "Formació en centres de treball", cycle: "TAPD" }
];

export function normalizeModule(inputCode, inputName) {
    if (!inputName && !inputCode) return null;

    const normName = (inputName || '').toLowerCase().trim();
    const normCode = (inputCode || '').toUpperCase().trim();

    // 1. Try exact name match (most reliable)
    let match = CANONICAL_MODULES.find(m => m.name.toLowerCase() === normName);

    // 2. Try partial name match (if strong enough)
    if (!match && normName.length > 5) {
        match = CANONICAL_MODULES.find(m => {
            // Avoid naive substring, but check key terms
            // "Destreses" -> MP09 TAPD
            // "Habilitats" -> MP09 TIS
            if (normName.includes('destreses')) return m.code === 'MP09' && m.cycle === 'TAPD';
            if (normName.includes('habilitats')) return m.code === 'MP09' && m.cycle === 'TIS';
            if (normName.includes('sanitària') || normName.includes('sanitaria')) return m.code === 'MP02' && m.cycle === 'TAPD';
            if (normName.includes('higiènica') || normName.includes('higienica')) return m.code === 'MP03' && m.cycle === 'TAPD';
            if (normName.includes('metodologia')) return m.code === 'MP02' && m.cycle === 'TIS';
            if (normName.includes('context')) return m.code === 'MP01' && m.cycle === 'TIS';
            if (normName.includes('organització') || normName.includes('organizació')) return m.code === 'MP01' && m.cycle === 'TAPD';

            return m.name.toLowerCase().includes(normName);
        });
    }

    // 3. Try Code match (Fallback, less reliable if name contradicts)
    // But if we have no name match, code is better than nothing
    // BUT we must distinguish TIS vs TAPD if code is ambiguous (MP01-13).
    // We can't know cycle just from MP01.
    // So we return a "Generic" or try to guess from the specific inputCode variations (e.g. MP0211 might map to MP09 if we knew the rule, but we don't).

    if (match) {
        return {
            ...match,
            label: `${match.code} - ${match.name} [${match.cycle}]`
        };
    }

    // Fallback: If no canonical match, return formatted input
    return {
        code: normCode,
        name: inputName || normCode,
        cycle: '?',
        label: `${normCode} - ${inputName || ''} [?]`
    };
}
