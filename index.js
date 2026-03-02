class MenuPlanner {
    constructor() {
        this.favoriteDishes = JSON.parse(localStorage.getItem('favoriteDishes')) || [];
        this.customTypes = JSON.parse(localStorage.getItem('customTypes')) || this.getDefaultTypes();
        this.currentWeekPlan = null;
        this.daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        this.meals = ['midi', 'soir'];
        
        this.init();
    }
    
    // ... (autres méthodes existantes)
    
    // Méthode d'export modifiée pour supporter CSV
    exportData() {
        const format = document.getElementById('exportFormat').value;
        
        if (format === 'csv') {
            this.exportToCSV();
        } else {
            this.exportToJSON();
        }
    }
    
    exportToJSON() {
        const data = {
            dishes: this.favoriteDishes,
            types: this.customTypes,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `menu-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('✅ Données exportées en JSON !');
    }
    
    exportToCSV() {
        // Créer l'en-tête du CSV
        let csv = 'Nom du plat,Saisons,Types\n';
        
        // Ajouter chaque plat
        this.favoriteDishes.forEach(dish => {
            const seasons = dish.seasons.join(';');
            const types = dish.types.map(typeId => {
                const type = this.customTypes.find(t => t.id === typeId);
                return type ? type.name : typeId;
            }).join(';');
            
            // Échapper les guillemets et les virgules dans le nom
            const name = dish.name.includes(',') ? `"${dish.name}"` : dish.name;
            
            csv += `${name},${seasons},${types}\n`;
        });
        
        // Ajouter les types personnalisés en commentaire
        csv += '\n# Types personnalisés\n';
        this.customTypes.forEach(type => {
            csv += `# ${type.id},${type.name},${type.color}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `menu-planner-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('✅ Données exportées en CSV !');
    }
    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (fileExt === 'csv') {
            this.importFromCSV(file);
        } else {
            this.importFromJSON(file);
        }
        
        // Réinitialiser l'input file
        event.target.value = '';
    }
    
    importFromCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                
                const newDishes = [];
                let startParsing = false;
                
                lines.forEach(line => {
                    line = line.trim();
                    
                    // Ignorer les commentaires et les lignes vides
                    if (line.startsWith('#') || line === '') return;
                    
                    // Détecter l'en-tête
                    if (line === 'Nom du plat,Saisons,Types') {
                        startParsing = true;
                        return;
                    }
                    
                    if (startParsing) {
                        // Parser la ligne CSV (gestion simple des guillemets)
                        let match = line.match(/(".*?"|[^,]*)(?:,|$)/g);
                        if (match && match.length >= 3) {
                            const name = match[0].replace(/^"|"$/g, '').replace(/,$/, '');
                            const seasons = match[1].replace(/,$/, '').split(';').filter(s => s);
                            const types = match[2].replace(/,$/, '').split(';').filter(t => t);
                            
                            // Convertir les noms de types en IDs
                            const typeIds = types.map(typeName => {
                                const existingType = this.customTypes.find(t => 
                                    t.name === typeName || t.name.includes(typeName)
                                );
                                if (existingType) return existingType.id;
                                
                                // Créer un nouveau type si nécessaire
                                const newId = typeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                                if (!this.customTypes.some(t => t.id === newId)) {
                                    this.customTypes.push({
                                        id: newId,
                                        name: typeName,
                                        color: this.getRandomColor()
                                    });
                                }
                                return newId;
                            });
                            
                            newDishes.push({
                                id: Date.now() + Math.random(),
                                name: name,
                                seasons: seasons,
                                types: typeIds
                            });
                        }
                    }
                });
                
                if (newDishes.length > 0) {
                    if (confirm(`${newDishes.length} plats trouvés. Ajouter à votre liste ?`)) {
                        this.favoriteDishes = [...this.favoriteDishes, ...newDishes];
                        this.saveCustomTypes();
                        this.saveToLocalStorage();
                        this.displayCustomTypes();
                        this.displayFavorites();
                        this.updateTypesInForms();
                        this.analyzeUsedTypes();
                        this.showNotification(`✅ ${newDishes.length} plats importés depuis CSV !`);
                    }
                } else {
                    alert('Aucun plat valide trouvé dans le fichier CSV');
                }
                
            } catch (error) {
                alert('Erreur lors de la lecture du fichier CSV');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
    
    importFromJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Valider le format des données
                if (!this.validateImportData(data)) {
                    throw new Error('Format de fichier invalide');
                }
                
                // Option : Fusionner ou remplacer ?
                if (confirm('Voulez-vous REMPLACER toutes vos données actuelles ? (Cliquez sur Annuler pour FUSIONNER avec les données existantes)')) {
                    // Remplacer
                    this.favoriteDishes = data.dishes || [];
                    this.customTypes = data.types || this.getDefaultTypes();
                } else {
                    // Fusionner
                    this.favoriteDishes = this.mergeDishes(this.favoriteDishes, data.dishes || []);
                    this.customTypes = this.mergeTypes(this.customTypes, data.types || []);
                }
                
                // Sauvegarder et rafraîchir
                this.saveToLocalStorage();
                this.saveCustomTypes();
                this.displayCustomTypes();
                this.displayFavorites();
                this.updateTypesInForms();
                this.analyzeUsedTypes();
                
                this.showNotification('✅ Données JSON importées avec succès !');
                
            } catch (error) {
                alert('Erreur : Le fichier sélectionné n\'est pas un JSON valide.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
    
    getRandomColor() {
        const colors = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565', '#38b2ac'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Méthode modifiée pour prendre en compte "pas de midi"
    generateWeeklyPlan(e) {
        e.preventDefault();
        
        const season = document.getElementById('weekSeason').value;
        const noLunchWeek = document.getElementById('noLunchWeek').checked;
        const mealConfigs = this.getMealConfigurations();
        
        // Vérifier qu'il y a des plats disponibles
        if (this.favoriteDishes.length === 0) {
            alert('Ajoutez d\'abord des plats favoris !');
            return;
        }
        
        // Générer le planning
        this.currentWeekPlan = {};
        
        for (let day of this.daysOfWeek) {
            this.currentWeekPlan[day] = {};
            for (let meal of this.meals) {
                // Si "pas de midi" est coché et que c'est le repas du midi, pas de plat
                if (noLunchWeek && meal === 'midi') {
                    this.currentWeekPlan[day][meal] = null;
                    continue;
                }
                
                const config = mealConfigs[`${day}-${meal}`];
                
                // Si config = 'aucun', pas de plat pour ce repas
                if (config === 'aucun') {
                    this.currentWeekPlan[day][meal] = null;
                    continue;
                }
                
                // Filtrer les plats disponibles selon la saison et le type
                let availableDishes = this.favoriteDishes.filter(dish => {
                    // Vérifier la saison
                    const seasonMatch = season === 'toutes' || dish.seasons.includes(season);
                    
                    // Vérifier le type
                    const typeMatch = config === 'tous' || dish.types.includes(config);
                    
                    return seasonMatch && typeMatch;
                });
                
                if (availableDishes.length === 0) {
                    // Pas de plat disponible pour ce créneau
                    this.currentWeekPlan[day][meal] = null;
                } else {
                    // Sélectionner un plat aléatoire
                    const randomIndex = Math.floor(Math.random() * availableDishes.length);
                    this.currentWeekPlan[day][meal] = availableDishes[randomIndex];
                }
            }
        }
        
        this.displayWeeklyPlan();
    }
    
    // Méthode d'affichage modifiée pour le planning horizontal
    displayWeeklyPlan() {
        const planningSection = document.getElementById('weeklyPlanning');
        const planningGrid = document.getElementById('planningGrid');
        const noLunchWeek = document.getElementById('noLunchWeek').checked;
        
        planningSection.style.display = 'block';
        
        // Ajouter un indicateur de scroll sur mobile
        const scrollHint = '<div class="scroll-hint">👆 Faites défiler horizontalement →</div>';
        
        planningGrid.innerHTML = this.daysOfWeek.map(day => `
            <div class="day-card">
                <h3>${day}</h3>
                ${this.meals.map(meal => {
                    // Ne pas afficher le repas du midi si l'option est cochée
                    if (noLunchWeek && meal === 'midi') return '';
                    
                    const mealData = this.currentWeekPlan[day][meal];
                    return `
                        <div class="meal">
                            <div class="meal-header">
                                <span class="meal-type">${meal === 'midi' ? '🍱 Midi' : '🌙 Soir'}</span>
                                <button class="reroll-btn" onclick="menuPlanner.rerollMeal('${day}', '${meal}')">
                                    🔄
                                </button>
                            </div>
                            ${mealData ? `
                                <div class="meal-name">${mealData.name}</div>
                                <div class="meal-tags">
                                    ${mealData.seasons.map(s => `
                                        <span class="meal-tag">${this.getSeasonLabel(s)}</span>
                                    `).join('')}
                                    ${mealData.types.map(typeId => {
                                        const type = this.customTypes.find(t => t.id === typeId);
                                        return type ? `
                                            <span class="meal-tag type-badge" style="background: ${type.color}; color: white;">
                                                ${type.name}
                                            </span>
                                        ` : '';
                                    }).join('')}
                                </div>
                            ` : `
                                <div class="meal-name no-meal">🚫 Aucun plat</div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');
        
        // Ajouter l'indicateur de scroll si nécessaire
        if (window.innerWidth <= 768) {
            planningGrid.insertAdjacentHTML('beforebegin', scrollHint);
        }
    }
}