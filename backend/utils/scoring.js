const calculateScore = (idea) => {
    let score = 0;

    if (idea.problem && idea.problem.length > 20) score += 10;
    if (idea.solution && idea.solution.length > 20) score += 10;
    if (idea.uniqueness && idea.uniqueness.length > 20) score += 10;
    if (idea.revenueModel && idea.revenueModel.length > 20) score += 10;
    if (idea.targetMarket && idea.targetMarket.length > 20) score += 10;
    if (idea.team && idea.team.length > 20) score += 10;
    if (idea.businessModel && idea.businessModel.length > 20) score += 10;

    let feedback = '';

    if (score >= 60) feedback = 'High Viability';
    else if (score >= 40) feedback = 'Moderate Viability';
    else feedback = 'Low Viability';

    return { score, feedback };
};

module.exports = { calculateScore };
