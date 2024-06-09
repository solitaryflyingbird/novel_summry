document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = ''; // Clear existing list
    const files = Array.from(event.target.files);

    // Sort files by name, taking numbers into account
    files.sort((a, b) => naturalCompare(a.name, b.name));

    files.forEach((file, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${file.name}`;
        listItem.addEventListener('click', () => displayFileContent(file));
        fileList.appendChild(listItem);
    });
});

function displayFileContent(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('fileContent').textContent = event.target.result;
    };
    reader.readAsText(file);
}

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


function displayFileContent(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('fileContent').textContent = event.target.result;
    };
    reader.readAsText(file);
}
