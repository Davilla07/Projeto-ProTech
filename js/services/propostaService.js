/**
 * PropostaService - Serviço de Geração de Propostas/Prompts
 * Gerencia toda a lógica de criação, armazenamento e histórico de propostas
 */

import AuthService from './AuthService.js';

class PropostaService {
    constructor() {
        this.storageKey = 'promptpro_propostas';
        this.templatesKey = 'promptpro_templates';
        this.templates = this.loadTemplates();
        this.currentProposta = null;
        this.init();
    }

    init() {
        if (this.templates.length === 0) {
            this.loadDefaultTemplates();
        }
    }

    async generateProposta(params) {
        try {
            const {
                tipo = 'geral',
                tema,
                objetivo,
                publicoAlvo,
                tom = 'profissional',
                detalhes = '',
                template = null
            } = params;

            if (!tema || tema.trim().length < 3) {
                throw new Error('Tema deve ter pelo menos 3 caracteres');
            }
            if (!objetivo || objetivo.trim().length < 10) {
                throw new Error('Objetivo deve ter pelo menos 10 caracteres');
            }

            await this.sleep(1000);

            const selectedTemplate = template || this.selectBestTemplate(tipo, tema);

            const proposta = this.buildProposta({
                tipo,
                tema: tema.trim(),
                objetivo: objetivo.trim(),
                publicoAlvo: publicoAlvo?.trim() || 'Público geral',
                tom,
                detalhes: detalhes.trim(),
                template: selectedTemplate
            });

            this.saveProposta(proposta);
            this.currentProposta = proposta;

            return {
                success: true,
                proposta,
                message: 'Proposta gerada com sucesso!'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    buildProposta(params) {
        const { tipo, tema, objetivo, publicoAlvo, tom, detalhes, template } = params;
        const contexto = this.buildContexto(params);
        const prompt = this.applyTemplate(template, params);
        const metadata = this.generateMetadata(params);

        return {
            id: this.generateId(),
            tipo,
            tema,
            objetivo,
            publicoAlvo,
            contexto,
            prompt,
            template: template?.name || 'Sem template',
            metadata,
            createdAt: new Date().toISOString(),
            userId: AuthService?.getCurrentUser()?.id || 'anonymous'
        };
    }

    buildContexto(params) {
        const { tema, objetivo, publicoAlvo, tom, detalhes } = params;
        let contexto = `## Contexto da Proposta\n\n`;
        contexto += `**Tema:** ${tema}\n`;
        contexto += `**Objetivo:** ${objetivo}\n`;
        contexto += `**Público-alvo:** ${publicoAlvo}\n`;
        contexto += `**Tom:** ${tom}\n`;
        if (detalhes) {
            contexto += `**Detalhes adicionais:** ${detalhes}\n`;
        }
        contexto += `\n---\n\n`;
        return contexto;
    }

    applyTemplate(template, params) {
        let prompt = template.structure;
        const variables = {
            '{TEMA}': params.tema,
            '{OBJETIVO}': params.objetivo,
            '{PUBLICO_ALVO}': params.publicoAlvo,
            '{TOM}': params.tom,
            '{DETALHES}': params.detalhes || 'Não especificado',
            '{DATA}': new Date().toLocaleDateString('pt-BR'),
            '{CONTEXTO_ADICIONAL}': this.generateContextoAdicional(params)
        };

        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        Object.entries(variables).forEach(([key, value]) => {
            prompt = prompt.replace(new RegExp(escapeRegExp(key), 'g'), value);
        });

        return prompt;
    }

    generateContextoAdicional(params) {
        const contextosAdicionais = {
            marketing: `
- Use gatilhos mentais apropriados
- Mantenha consistência com a marca`,
            vendas: `
- Identifique dores e necessidades específicas
- Apresente soluções concretas
- Inclua call-to-action persuasivo`,
            conteudo: `
- Estruture o conteúdo de forma didática
- Use exemplos práticos e relevantes
- Mantenha linguagem acessível`,
            tecnico: `
- Seja preciso e objetivo
- Inclua especificações técnicas necessárias
- Considere limitações e requisitos`,
            geral: `
- Mantenha clareza e objetividade
- Adapte-se ao contexto específico
- Foque nos resultados esperados`
        };

        return contextosAdicionais[params.tipo] || contextosAdicionais.geral;
    }

    selectBestTemplate(tipo, tema) {
        let suitableTemplates = this.templates.filter(t => t.type === tipo);
        if (suitableTemplates.length === 0) {
            suitableTemplates = this.templates.filter(t => t.type === 'geral');
        }
        const thematicTemplate = suitableTemplates.find(t =>
            t.keywords.some(keyword =>
                tema.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        return thematicTemplate || suitableTemplates[0];
    }

    generateMetadata(params) {
        const wordCount = params.objetivo.split(' ').length;
        const complexity = this.calculateComplexity(params);
        const estimatedTime = this.estimateExecutionTime(params);

        return {
            wordCount,
            complexity,
            estimatedTime,
            language: 'pt-BR',
            version: '1.0',
            tags: this.generateTags(params)
        };
    }

    calculateComplexity(params) {
        let score = 0;
        score += Math.min(params.objetivo.length / 100, 3);
        if (params.detalhes) score += Math.min(params.detalhes.length / 100, 2);

        const typeComplexity = {
            tecnico: 3,
            vendas: 2,
            marketing: 2,
            conteudo: 1,
            geral: 1
        };
        score += typeComplexity[params.tipo] || 1;

        if (score <= 2) return 'baixa';
        if (score <= 4) return 'média';
        return 'alta';
    }

    estimateExecutionTime(params) {
        const baseTime = 30; // minutos
        const complexityMultiplier = {
            baixa: 1,
            média: 1.5,
            alta: 2.5
        };
        const complexity = this.calculateComplexity(params);
        return Math.round(baseTime * complexityMultiplier[complexity]);
    }

    generateTags(params) {
        const tags = [params.tipo, params.tom];
        const themeKeywords = params.tema.toLowerCase().split(' ');
        tags.push(...themeKeywords.filter(word => word.length > 3));
        if (params.publicoAlvo && params.publicoAlvo !== 'Público geral') {
            tags.push(params.publicoAlvo.toLowerCase());
        }
        return [...new Set(tags)];
    }

    saveProposta(proposta) {
        try {
            const propostas = this.getHistorico();
            propostas.unshift(proposta);
            const limited = propostas.slice(0, 50);
            localStorage.setItem(this.storageKey, JSON.stringify(limited));
        } catch (error) {
            console.error('Error saving proposta:', error);
        }
    }

    getHistorico(userId) {
        try {
            const propostas = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            if (userId) {
                return propostas.filter(p => p.userId === userId);
            }
            return propostas;
        } catch {
            return [];
        }
    }

    getPropostaById(id) {
        const propostas = this.getHistorico();
        return propostas.find(p => p.id === id);
    }

    deleteProposta(id) {
        try {
            const propostas = this.getHistorico();
            const filtered = propostas.filter(p => p.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
            return true;
        } catch {
            return false;
        }
    }

    exportProposta(proposta, format = 'txt') {
        if (format !== 'txt') {
            throw new Error("Formato de exportação não suportado. Apenas 'txt' é permitido.");
        }
        const content = this.formatPropostaForExport(proposta);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proposta_${proposta.tema.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    formatPropostaForExport(proposta) {
        return `
# ${proposta.tema}

${proposta.contexto}

## Prompt Gerado

${proposta.prompt}

---

**Gerado em:** ${new Date(proposta.createdAt).toLocaleString('pt-BR')}
**Template:** ${proposta.template}
**Complexidade:** ${proposta.metadata.complexity}
**Tempo estimado:** ${proposta.metadata.estimatedTime} minutos

**Tags:** ${proposta.metadata.tags.join(', ')}
`;
    }

    loadTemplates() {
        try {
            const templates = localStorage.getItem(this.templatesKey);
            return templates ? JSON.parse(templates) : [];
        } catch {
            return [];
        }
    }

    loadDefaultTemplates() {
        const defaultTemplates = [
            // ... (mantém os templates como já estão no seu código)
            // Copie os templates do seu código original aqui
        ];
        this.templates = defaultTemplates;
        this.saveTemplates();
        return defaultTemplates;
    }

    saveTemplates() {
        try {
            localStorage.setItem(this.templatesKey, JSON.stringify(this.templates));
        } catch (error) {
            console.error('Error saving templates:', error);
        }
    }

    generateId() {
        return 'prop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getUserStats(userId) {
        const propostas = this.getHistorico(userId);

        if (propostas.length === 0) {
            return {
                total: 0,
                thisMonth: 0,
                mostUsedType: null,
                avgComplexity: null
            };
        }

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const thisMonthCount = propostas.filter(p =>
            new Date(p.createdAt) >= thisMonth
        ).length;

        const typeCounts = {};
        propostas.forEach(p => {
            typeCounts[p.tipo] = (typeCounts[p.tipo] || 0) + 1;
        });
        const mostUsedType = Object.keys(typeCounts).reduce((a, b) =>
            typeCounts[a] > typeCounts[b] ? a : b
        );

        const complexities = propostas.map(p => p.metadata.complexity);
        const complexityScores = complexities.map(c =>
            c === 'baixa' ? 1 : c === 'média' ? 2 : 3
        );
        const avgComplexityScore = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;
        const avgComplexity = avgComplexityScore <= 1.5 ? 'baixa' :
            avgComplexityScore <= 2.5 ? 'média' : 'alta';

        return {
            total: propostas.length,
            thisMonth: thisMonthCount,
            mostUsedType,
            avgComplexity
        };
    }
}

// Instância única
const propostaService = new PropostaService();

// Disponibilizar globalmente (apenas uma instância)
window.PropostaService = propostaService;

export default propostaService;