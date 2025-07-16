let allRecipes = [];
let filteredRecipes = [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchBox').addEventListener('input', handleSearch);
    document.getElementById('refreshBtn').addEventListener('click', loadRecipes);
    loadRecipes();
});

async function loadRecipes() {
    showMessage('Cargando recetas...');
    allRecipes = [];
    
    let recipeNumber = 1;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5; // Stop after 5 consecutive failures

    while (consecutiveFailures < maxConsecutiveFailures) {
        const filename = `recipe${recipeNumber}.txt`;
        
        try {
            const response = await fetch(`./recipes/${filename}`);
            if (response.ok) {
                const content = await response.text();
                const recipe = parseRecipe(content, filename);
                if (recipe) {
                    allRecipes.push(recipe);
                }
                consecutiveFailures = 0; // Reset counter on success
            } else {
                consecutiveFailures++;
                if (consecutiveFailures === 1) {
                    console.log(`Recipe ${recipeNumber} not found, checking for more...`);
                }
            }
        } catch (error) {
            consecutiveFailures++;
            console.error(`Error loading ${filename}:`, error);
        }
        
        recipeNumber++;
        
        // Optional: Add a reasonable upper limit to prevent infinite loops
        if (recipeNumber > 20) {
            console.warn('Reached maximum recipe number limit (1000)');
            break;
        }
    }

    console.log(`Loaded ${allRecipes.length} recipes (checked up to recipe${recipeNumber - 1}.txt)`);

    if (allRecipes.length === 0) {
        showError('No recipes found. Make sure your recipe files are in the ./recipes folder.');
        return;
    }

    filteredRecipes = [...allRecipes];
    displayRecipes();
}

function parseRecipe(content, filename) {
    const lines = content.split('\n');
    let title = "err"; //filename.replace(/\.(md|txt)$/, '').replace(/_/g, ' ');
    let ingredients = [];
    let procedure = [];
    let images = [];
    let currentSection = null;

    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('# ')) {
            title = line.substring(2).trim();
        } else if (line.toLowerCase().includes('ingredients')) {
            currentSection = 'ingredients';
        } else if (line.toLowerCase().includes('procedure')) {
            currentSection = 'procedure';
        } else if (line.toLowerCase().includes('images')) {
            currentSection = 'images';
        } else if (line.startsWith('* ') && currentSection === 'ingredients') {
            ingredients.push(line.substring(2).trim());
        } else if (line.match(/^\d+\.\s/) && currentSection === 'procedure') {
            procedure.push(line.replace(/^\d+\.\s/, '').trim());
        } else if (line && currentSection === 'images') {
            if (line.startsWith('http') || line.startsWith('./') || line.startsWith('../') || 
                line.includes('.jpg') || line.includes('.png') || line.includes('.jpeg') || 
                line.includes('.gif') || line.includes('.webp')) {
                images.push(line);
            }
        }
    }
if (title.equals("err")) return false;
    return {
        title,
        ingredients,
        procedure,
        images,
        filename
    };
}

function displayRecipes() {
    const container = document.getElementById('recipesContainer');
    
    if (filteredRecipes.length === 0) {
        container.innerHTML = '<div class="no-recipes">No se encontraron recetas.</div>';
        return;
    }

    container.innerHTML = filteredRecipes.map(recipe => `
        <div class="recipe-card">
            <h2 class="recipe-title">${escapeHtml(recipe.title)}</h2>
            
            ${recipe.ingredients.length > 0 ? `
                <div class="recipe-section">
                    <h3 class="ingredients">Ingredientes</h3>
                    <ul>
                        ${recipe.ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${recipe.procedure.length > 0 ? `
                <div class="recipe-section">
                    <h3 class="procedure">Pasos</h3>
                    <ol>
                        ${recipe.procedure.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
                    </ol>
                </div>
            ` : ''}
            
            ${recipe.images.length > 0 ? `
                <div class="recipe-section">
                    <h3 class="images">Imágenes</h3>
                    <div class="recipe-images">
                        ${recipe.images.map(image => `
                            <img src="${escapeHtml(image)}" alt="Recipe image" class="recipe-image" 
                                 onerror="this.style.display='none'">
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (searchTerm === '') {
        filteredRecipes = [...allRecipes];
    } else {
        filteredRecipes = allRecipes.filter(recipe => 
            recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm)) ||
            recipe.procedure.some(step => step.toLowerCase().includes(searchTerm))
        );
    }
    
    displayRecipes();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message) {
    const container = document.getElementById('recipesContainer');
    container.innerHTML = `<div class="loading">${message}</div>`;
}

function showError(message) {
    const container = document.getElementById('recipesContainer');
    container.innerHTML = `<div class="error">${message}</div>`;
}
