document.addEventListener('DOMContentLoaded', () => {
    openTab('sentence');
    loadSettings();
    document.getElementById('process-button').addEventListener('click', processInputText);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('generate-alternatives-button').addEventListener('click', generateAlternatives);
    document.getElementById('output-container').addEventListener('keydown', handleKeyDown);
});

function processInputText() {
    const inputText = document.getElementById('sentence-input').value;
    const sentences = inputText.split(/(?<=[.?!。])/).filter(sentence => sentence.trim().length > 0);
    const outputContainer = document.getElementById('output-container');

    outputContainer.innerHTML = '';

    sentences.forEach((sentence, index) => {
        createSentencePart(sentence, index);
    });

    updateCombinedSentence();
}

function createSentencePart(sentence, index, referenceNode = null) {
    const sentenceContainer = document.createElement('div');
    sentenceContainer.className = 'sentence-container';

    const sentencePart = document.createElement('span');
    sentencePart.className = 'sentence-part';
    sentencePart.contentEditable = 'true';
    sentencePart.textContent = sentence.trim() || '\u00A0';
    sentencePart.dataset.index = index;
    sentencePart.style.display = 'inline-block';

    sentencePart.addEventListener('input', () => {
        if (sentencePart.textContent.trim() === '') {
            sentencePart.innerHTML = '\u00A0';
        }
        updateCombinedSentence();
    });
    sentencePart.addEventListener('click', (event) => handleSentencePartClick(index, sentencePart, event));

    const checkpoint = document.createElement('div');
    checkpoint.className = 'checkpoint';
    checkpoint.addEventListener('click', (event) => toggleCheck(event, sentencePart));
    sentencePart.appendChild(checkpoint);

    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    suggestionsContainer.style.display = 'none';

    sentenceContainer.appendChild(sentencePart);
    sentenceContainer.appendChild(suggestionsContainer);

    const parentContainer = document.getElementById('output-container');
    if (referenceNode) {
        parentContainer.insertBefore(sentenceContainer, referenceNode);
    } else {
        parentContainer.appendChild(sentenceContainer);
    }
}

function handleEnterKey(sentencePart, cursorPosition) {
    const beforeText = sentencePart.textContent.slice(0, cursorPosition).trim();
    const afterText = sentencePart.textContent.slice(cursorPosition).trim();
    const currentIndex = parseInt(sentencePart.dataset.index);

    const currentContainer = sentencePart.closest('.sentence-container');
    const referenceNode = currentContainer.nextElementSibling;

    currentContainer.remove();

    createSentencePart(beforeText, currentIndex, referenceNode);
    createSentencePart(afterText, currentIndex + 1, referenceNode);

    updateIndices();
    updateCombinedSentence();
}

function handleBackspaceKey(sentencePart, cursorPosition) {
    if (cursorPosition === 0) {
        const currentContainer = sentencePart.closest('.sentence-container');
        let previousContainer = currentContainer.previousElementSibling;

        while (previousContainer && !previousContainer.classList.contains('sentence-container')) {
            previousContainer = previousContainer.previousElementSibling;
        }

        if (previousContainer && previousContainer.classList.contains('sentence-container')) {
            const previousSentencePart = previousContainer.querySelector('.sentence-part');
            const combinedText = `${previousSentencePart.textContent.trim()} ${sentencePart.textContent.trim()}`;
            const previousIndex = parseInt(previousSentencePart.dataset.index);
            const referenceNode = currentContainer.nextElementSibling;

            currentContainer.remove();
            previousContainer.remove();

            createSentencePart(combinedText, previousIndex, referenceNode);

            updateIndices();
            updateCombinedSentence();
        }
    }
}

function handleSentencePartClick(index, sentencePart, event) {
    if (event.target.classList.contains('checkpoint')) {
        return;
    }

    document.querySelectorAll('.sentence-part').forEach(part => part.classList.remove('active'));
    sentencePart.classList.add('active');

    document.querySelectorAll('.suggestions-container').forEach(container => container.style.display = 'none');
    const suggestionsContainer = sentencePart.nextElementSibling;
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'block';
    }
}

function toggleCheck(event, sentencePart) {
    event.stopPropagation();
    sentencePart.classList.toggle('checked');
}

function handleKeyDown(event) {
    if (!event.target.classList.contains('sentence-part')) return;

    const sentencePart = event.target;
    const cursorPosition = window.getSelection().getRangeAt(0).startOffset;

    if (event.key === 'Enter') {
        event.preventDefault();
        handleEnterKey(sentencePart, cursorPosition);
    } else if (event.key === 'Backspace') {
        handleBackspaceKey(sentencePart, cursorPosition);
    }
}

function updateIndices() {
    const sentenceContainers = document.querySelectorAll('.sentence-container');
    sentenceContainers.forEach((container, index) => {
        const sentencePart = container.querySelector('.sentence-part');
        sentencePart.dataset.index = index;
    });
}

function saveSettings() {
    const apiKey = document.getElementById('api-key').value;
    const apiPrompt = document.getElementById('api-prompt').value;
    const apiModel = document.getElementById('api-model').value;
    const suggestionsCount = document.getElementById('suggestions-count').value;

    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('apiPrompt', apiPrompt);
    localStorage.setItem('apiModel', apiModel);
    localStorage.setItem('suggestionsCount', suggestionsCount);

    alert('Settings saved.');
}

function loadSettings() {
    document.getElementById('api-key').value = localStorage.getItem('apiKey') || '';
    document.getElementById('api-prompt').value = localStorage.getItem('apiPrompt') || '';
    document.getElementById('api-model').value = localStorage.getItem('apiModel') || '';
    document.getElementById('suggestions-count').value = localStorage.getItem('suggestionsCount') || '1';
}

async function generateAlternatives() {
    const apiKey = localStorage.getItem('apiKey');
    const apiPrompt = localStorage.getItem('apiPrompt');
    const apiModel = localStorage.getItem('apiModel');
    const suggestionsCount = parseInt(localStorage.getItem('suggestionsCount'), 10);
    const sentenceParts = document.querySelectorAll('.sentence-part');
    const processingIndicator = document.getElementById('processing-indicator');

    if (!apiKey) {
        alert('Please set API Key in the Settings tab.');
        return;
    }

    processingIndicator.style.display = 'inline';

    const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

    try {
        for (let i = 0; i < sentenceParts.length; i++) {
            const sentencePart = sentenceParts[i];
            const index = sentencePart.dataset.index;
            if (sentencePart.classList.contains('checked')) {
                continue;
            }
            const suggestionsContainer = sentencePart.nextElementSibling;
            const sentenceText = sentencePart.textContent;
            const result_only = "쓸대없는 말 없이 결과물만 출력해.";
            const fullPrompt = `${apiPrompt} ${result_only} ${sentenceText}`;
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: apiModel,
                    messages: [{ role: 'user', content: fullPrompt }],
                    max_tokens: 150,
                    temperature: 0.7,
                    n: suggestionsCount
                })
            });

            const data = await response.json();
            suggestionsContainer.innerHTML = '';

            if (data.choices && data.choices.length > 0) {
                data.choices.forEach((choice) => {
                    const suggestionText = choice.message.content.trim();
                    const suggestionElement = document.createElement('div');
                    suggestionElement.className = 'suggestion';
                    suggestionElement.textContent = suggestionText;

                    suggestionElement.addEventListener('click', () => {
                        const checkpoint = sentencePart.querySelector('.checkpoint');
                        sentencePart.textContent = suggestionText;
                        sentencePart.appendChild(checkpoint);
                        updateCombinedSentence();
                    });

                    suggestionsContainer.appendChild(suggestionElement);
                });
            } else {
                const suggestionElement = document.createElement('div');
                suggestionElement.className = 'suggestion';
                suggestionElement.textContent = 'No suggestions available';

                suggestionsContainer.appendChild(suggestionElement);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        sentenceParts.forEach((sentencePart, index) => {
            const suggestionsContainer = sentencePart.nextElementSibling;
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion';
            suggestionElement.textContent = `Error: ${error.message}`;
            suggestionsContainer.appendChild(suggestionElement);
        });
    } finally {
        processingIndicator.style.display = 'none';
    }
}

function updateCombinedSentence() {
    const combinedSentenceContainer = document.getElementById('combined-sentence-container');
    const sentenceParts = document.querySelectorAll('.sentence-part');
    const combinedSentence = Array.from(sentenceParts).map(part => part.textContent.trim()).join(' ');
    combinedSentenceContainer.textContent = combinedSentence;
}

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.getElementById(tabName).style.display = 'block';

    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active-tab'));
    document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add('active-tab');
}

function openGitHub() {
    window.open('https://github.com/solitaryflyingbird/text_maker', '_blank');
}