console.log('🔍 DEBUG - Verificando status do projeto');

// Função de debug rápido (apenas para desenvolvimento)
window.debugProject = function() {
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
        console.group('🔍 Status do Projeto');
        
        // Verificar módulos globais
        const modules = ['Toast', 'Router', 'AuthService', 'DarkMode', 'HealthCheck', 'Validation'];
        console.log('📦 Módulos Globais:');
        modules.forEach(mod => {
            const available = !!window[mod];
            console.log(`  ${mod}: ${available ? '✅' : '❌'} ${available ? typeof window[mod] : 'não encontrado'}`);
        });
        
        // Verificar DOM
        console.log('🏗️ DOM:');
        console.log(`  readyState: ${document.readyState}`);
        console.log(`  title: ${document.title}`);
        
        // Verificar loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        console.log('⏳ Loading Overlay:');
        console.log(`  encontrado: ${!!loadingOverlay}`);
        if (loadingOverlay) {
            console.log(`  display: ${loadingOverlay.style.display}`);
            console.log(`  opacity: ${loadingOverlay.style.opacity}`);
        }
        
        // Health check se disponível
        if (window.checkHealth) {
            console.log('🏥 Executando Health Check...');
            window.checkHealth();
        } else {
            console.log('🏥 Health Check não disponível');
        }
        
        console.groupEnd();
    }
};

// Executar automaticamente após 2 segundos (apenas em desenvolvimento)
if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
    setTimeout(() => {
        window.debugProject();
    }, 2000);
}
