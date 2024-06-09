let main_text_Dictionary = {};
let summaries_Dictionary = {};
let currentFileName = '';

// File input change event
document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = ''; // Clear existing list
    main_text_Dictionary = {}; // Initialize global variable
    summaries_Dictionary = {}; // Initialize summaries global variable

    const files = Array.from(event.target.files); // Convert file list to array

    // Sort files by name, taking numbers into account
    files.sort((a, b) => naturalCompare(a.name, b.name));

    files.forEach((file, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${file.name}`;
        listItem.addEventListener('click', () => {
            displayFileContent(file.name);
            currentFileName = file.name;
        });
        fileList.appendChild(listItem);

        // Read file content and store in the dictionary
        const reader = new FileReader();
        reader.onload = function(event) {
            main_text_Dictionary[file.name] = event.target.result + "\n\n 다음 글을 500자 가량으로 요약해줘.";
            summaries_Dictionary[file.name] = ''; // Initialize summary as empty
        };
        reader.readAsText(file);
    });
});

// Function to display file content
function displayFileContent(fileName) {
    const fileContent = main_text_Dictionary[fileName];
    const fileSummary = summaries_Dictionary[fileName];
    if (fileContent) {
        document.getElementById('fileContent').textContent = fileContent;
        document.getElementById('fileContent').setAttribute('contenteditable', 'false');
    } else {
        document.getElementById('fileContent').textContent = 'Error: File content not found';
    }
    if (fileSummary) {
        document.getElementById('fileSummary').textContent = fileSummary;
    } else {
        document.getElementById('fileSummary').textContent = 'No summary available.';
    }
}

// Edit button event
document.getElementById('editButton').addEventListener('click', function() {
    const fileContentElement = document.getElementById('fileContent');
    fileContentElement.setAttribute('contenteditable', 'true');
    document.getElementById('saveEditButton').style.display = 'inline';
});

// Save edit button event
document.getElementById('saveEditButton').addEventListener('click', function() {
    const fileContentElement = document.getElementById('fileContent');
    fileContentElement.setAttribute('contenteditable', 'false');
    document.getElementById('saveEditButton').style.display = 'none';
    if (currentFileName) {
        main_text_Dictionary[currentFileName] = fileContentElement.textContent;
    }
});

// Function to compare strings with numbers naturally
function naturalCompare(a, b) {
    const ax = [], bx = [];

    a.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
        ax.push([$1 || Infinity, $2 || ""]);
    });
    b.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
        bx.push([$1 || Infinity, $2 || ""]);
    });

    while (ax.length && bx.length) {
        const an = ax.shift();
        const bn = bx.shift();
        const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) return nn;
    }

    return ax.length - bx.length;
}

// Save API key button event
document.getElementById('saveApiKeyButton').addEventListener('click', function() {
    // Get the value from the input field
    const apiKey = document.getElementById('apiKeyInput').value;

    // Save the API key to localStorage
    if (apiKey) {
        localStorage.setItem('gptApiKey', apiKey);
        alert('API key saved successfully!');
    } else {
        alert('Please enter a valid API key.');
    }
});

// Load the API key from localStorage when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const savedApiKey = localStorage.getItem('gptApiKey');
    if (savedApiKey) {
        document.getElementById('apiKeyInput').value = savedApiKey;
    }
});

// Function to call GPT API and get the summary
async function getSummaryFromGPT(content, apiKey) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    const data = {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: content }],
        max_tokens: 350,
        temperature: 0.7,
        n: 1
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    return responseData.choices[0].message.content.trim();
}

// Run button event
document.getElementById('runButton').addEventListener('click', async function() {
    const apiKey = localStorage.getItem('gptApiKey');
    const fileContentElement = document.getElementById('fileContent').textContent;

    if (!apiKey) {
        alert('Please enter and save your GPT API key first.');
        return;
    }

    if (!fileContentElement) {
        alert('Please select a file and make sure it has content.');
        return;
    }

    try {
        const summary = await getSummaryFromGPT(fileContentElement, apiKey);
        document.getElementById('fileSummary').textContent = summary;
        if (currentFileName) {
            summaries_Dictionary[currentFileName] = summary; // Save the summary
        }
    } catch (error) {
        alert('Failed to get summary from GPT: ' + error.message);
    }
});

// Run All button event
document.getElementById('runAllButton').addEventListener('click', async function() {
    const apiKey = localStorage.getItem('gptApiKey');

    if (!apiKey) {
        alert('Please enter and save your GPT API key first.');
        return;
    }

    for (const fileName in main_text_Dictionary) {
        if (main_text_Dictionary.hasOwnProperty(fileName)) {
            const content = main_text_Dictionary[fileName];
            try {
                const summary = await getSummaryFromGPT(content, apiKey);
                summaries_Dictionary[fileName] = summary; // Save the summary
                if (fileName === currentFileName) {
                    document.getElementById('fileSummary').textContent = summary; // Update the displayed summary if it's the current file
                }
            } catch (error) {
                alert(`Failed to get summary for ${fileName}: ` + error.message);
            }
        }
    }
});
