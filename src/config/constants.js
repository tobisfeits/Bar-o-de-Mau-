export const CONFIG = {
    USERS: [
        { id: 'u1', name: 'Diane', pin: 'dia2026' },
        { id: 'u2', name: 'Silas', pin: 'sil2026' },
        { id: 'u3', name: 'Vânia', pin: 'vân2026' },
        { id: 'u4', name: 'Tobias', pin: 'tob2026' }
    ],
    SCORE_ITEMS: [
        { id: 'punctuality', name: 'Pontualidade', points: 20 },
        { id: 'presence', name: 'Presença', points: 10 },
        { id: 'uniform', name: 'Uniforme', points: 15 },
        { id: 'presentation', name: 'Apresentação/Asseio', points: 20 },
        { id: 'materials', name: 'Material', points: 20 },
        { id: 'discipline', name: 'Disciplina', points: 15 },
        { id: 'classwork', name: 'Tarefas de Classe', points: 30 },
        { id: 'teamspirit', name: 'Espírito de Equipe', points: 10 },
        { id: 'biblicalyear', name: 'Ano Bíblico', points: 20 },
        { id: 'sabbathschool', name: 'Escola Sabatina', points: 20 }
    ],
    COUNSELOR_ITEMS: [
        { id: 'uniform', name: 'Uniforme Completo', points: 20 },
        { id: 'punctuality', name: 'Pontualidade', points: 20 },
        { id: 'report', name: 'Relatório Entregue', points: 20 },
        { id: 'presence', name: 'Presença', points: 10 },
        { id: 'materials', name: 'Material Organizado', points: 15 },
        { id: 'planning', name: 'Planejamento', points: 15 },
        { id: 'socialmedia', name: 'Redes Sociais', points: 10 }
    ],
    PRAYER_EVENT: {
        id: 'prayer_10days',
        name: '10 Dias de Oração',
        startDate: '2026-02-18',
        endDate: '2026-03-04',
        levels: [
            { id: 'very_satisfactory', name: 'Muito Satisfatório', points: 4, color: 'green', emoji: '🟢' },
            { id: 'satisfactory', name: 'Satisfatório', points: 2, color: 'yellow', emoji: '🟡' },
            { id: 'not_satisfactory', name: 'Não Satisfatório', points: 1, color: 'orange', emoji: '🟠' },
            { id: 'absent', name: 'Ausente', points: 0, color: 'red', emoji: '🔴' }
        ]
    },
    IMPACTO_EVENT: {
        date: '2026-03-28',
        name: 'Impacto Esperança',
        emoji: '✨',
        items: [
            { id: 'presenca', name: 'Presença', points: 20 },
            { id: 'uniforme', name: 'Uniforme', points: 20 }
        ],
        maxPoints: 40
    },
    STORAGE_KEYS: {
        UNITS: 'cd_units',
        MEMBERS: 'cd_members',
        SCORES: 'cd_scores',
        COUNSELOR_SCORES: 'cd_counselor_scores',
        CURRENT_USER: 'cd_current_user',
        USERS: 'cd_users',
        MEETINGS: 'cd_meetings'
    },
    TOTAL_POINTS: 184,
    TOTAL_COUNSELOR_POINTS: 110
};
