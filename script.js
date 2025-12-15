function shareCard() {
    // Dados para compartilhamento
    const shareData = {
        title: 'JS Serralheria',
        text: 'Entre em contato com Josevando Ramos - Metalúrgica e Serralheria.',
        url: 'https://js-serralheria.netlify.app'
    };

    // Verifica se o navegador suporta a API de compartilhamento nativo (Celular)
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Compartilhado com sucesso'))
            .catch((error) => console.log('Erro ao compartilhar', error));
    } else {
        // Fallback para computadores: Copia o link
        navigator.clipboard.writeText('https://js-serralheria.netlify.app');
        alert("Link copiado para a área de transferência!");
    }
}