class MenuPlanner {
    constructor() {
        this.favoriteDishes = JSON.parse(localStorage.getItem('favoriteDishes')) || [];
        this.customTypes = JSON.parse(localStorage.getItem('customTypes')) || this.getDefaultTypes();
        this.currentWeekPlan = null;
        this.daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        this.meals = ['midi', 'soir'];
        
        this.init();
    }
    
    getDefaultTypes() {
        // Types par défaut avec leurs couleurs
        return [
            { id: 'viande', name: '🥩 Viande', color: '#e53e3e' },
            { id: 'poisson', name: '🐟 Poisson', color: '#3182ce' },
            { id: 'vegetarien', name: '🥗 Végétarien', color: '#38a169' },
            { id: 'vegan', name: '🌱 Vegan', color: '#68d391' },
            { id: 'pates', name: '🍝 Pâtes', color: '#d69e2e' },
            { id: 'riz', name: '🍚 Riz', color: '#b7791f' },
            { id: 'soupe', name: '🥣 Soupe', color: '#9f7aea' },
            { id: 'salade', name: '🥗 Salade', color: '#48bb78' }
        ];
    }
    
    init() {
        // Écouteurs d'événements
        document.getElementById('dishForm').addEventListener('submit', (e) => this.addDish(e));
        document.getElementById('typeForm').addEventListener('submit', (e) => this.addCustomType(e));
        document.getElementById('generatePlanBtn').addEventListener('click', (e) => this.generateWeeklyPlan(e));
        document.getElementById('exportDataBtn').addEventListener('click', (e) => this.exportData());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        
        // Afficher les types personnalisés
        this.displayCustomTypes();
        
        // Afficher les plats favoris
        this.displayFavorites();
        
        // Générer la configuration des repas
        this.generateMealsConfig();
        
        // Analyser les types utilisés
        this.analyzeUsedTypes();
        
        // Ajouter les animations CSS
        this.addAnimations();
    }
    
    addAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(5px); }
            }
            
            .type-stat-card {
                background: white;
                padding: 10px 15px;
                border-radius: 5px;
                border-left: 4px solid;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .type-stat-name {
                font-weight: 500;
            }
            
            .type-stat-count {
                background: #f0f0f0;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
            }
            
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #48bb78;
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    analyzeUsedTypes() {
        const usedTypesContainer = document.getElementById('usedTypesList');
        if (!usedTypesContainer) return;
        
        // Compter l'utilisation de chaque type
        const typeCount = {};
        this.favoriteDishes.forEach(dish => {
            dish.types.forEach(typeId => {
                typeCount[typeId] = (typeCount[typeId] || 0) + 1;
            });
        });
        
        // Afficher les statistiques
        const typesWithStats = this.customTypes.map(type => ({
            ...type,
            count: typeCount[type.id] || 0
        })).filter(type => type.count > 0);
        
        if (typesWithStats.length === 0) {
            usedTypesContainer.innerHTML = '<p class="empty-message">Aucun type utilisé pour le moment</p>';
            return;
        }
        
        usedTypesContainer.innerHTML = typesWithStats.map(type => `
            <div class="type-stat-card" style="border-left-color: ${type.color}">
                <span class="type-stat-name" style="color: ${type.color}">${type.name}</span>
                <span class="type-stat-count">${type.count} plat${type.count > 1 ? 's' : ''}</span>
            </div>
        `).join('');
    }
    
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
    
    validateImportData(data) {
        return data && (data.dishes || data.types);
    }
    
    mergeDishes(existingDishes, newDishes) {
        const merged = [...existingDishes];
        const existingIds = new Set(existingDishes.map(d => d.id));
        
        newDishes.forEach(dish => {
            if (!existingIds.has(dish.id)) {
                merged.push(dish);
            }
        });
        
        return merged;
    }
    
    mergeTypes(existingTypes, newTypes) {
        const merged = [...existingTypes];
        const existingIds = new Set(existingTypes.map(t => t.id));
        
        newTypes.forEach(type => {
            if (!existingIds.has(type.id)) {
                merged.push(type);
            }
        });
        
        return merged;
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    addCustomType(e) {
        e.preventDefault();
        
        const typeName = document.getElementById('typeName').value.trim();
        const typeColor = document.getElementById('typeColor').value;
        
        if (!typeName) return;
        
        // Créer un ID unique basé sur le nom
        const typeId = typeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // Vérifier si le type existe déjà
        if (this.customTypes.some(t => t.id === typeId || t.name.toLowerCase() === typeName.toLowerCase())) {
            alert('Ce type de plat existe déjà !');
            return;
        }
        
        this.customTypes.push({
            id: typeId,
            name: typeName,
            color: typeColor
        });
        
        this.saveCustomTypes();
        this.displayCustomTypes();
        this.updateTypesInForms();
        
        // Réinitialiser le formulaire
        e.target.reset();
        document.getElementById('typeColor').value = '#667eea';
        
        this.showNotification(`✅ Type "${typeName}" ajouté !`);
    }
    
    deleteCustomType(typeId) {
        // Ne pas permettre la suppression des types par défaut
        const defaultTypeIds = ['viande', 'poisson', 'vegetarien', 'vegan', 'pates', 'riz', 'soupe', 'salade'];
        
        if (defaultTypeIds.includes(typeId)) {
            alert('Les types par défaut ne peuvent pas être supprimés !');
            return;
        }
        
        // Vérifier si le type est utilisé dans des plats
        const isUsed = this.favoriteDishes.some(dish => dish.types.includes(typeId));
        
        if (isUsed) {
            if (!confirm('Ce type est utilisé dans certains plats. Êtes-vous sûr de vouloir le supprimer ?')) {
                return;
            }
            
            // Supprimer le type des plats qui l'utilisent
            this.favoriteDishes = this.favoriteDishes.map(dish => ({
                ...dish,
                types: dish.types.filter(t => t !== typeId)
            }));
            this.saveToLocalStorage();
        }
        
        this.customTypes = this.customTypes.filter(t => t.id !== typeId);
        this.saveCustomTypes();
        this.displayCustomTypes();
        this.updateTypesInForms();
        this.displayFavorites();
        this.analyzeUsedTypes();
        
        this.showNotification(`✅ Type supprimé !`);
    }
    
    displayCustomTypes() {
        const container = document.getElementById('typesList');
        
        container.innerHTML = this.customTypes.map(type => `
            <div class="type-tag" style="background: ${type.color}20; border-color: ${type.color}">
                <span class="color-dot" style="background: ${type.color}"></span>
                <span class="type-name">${type.name}</span>
                <button class="delete-type" onclick="menuPlanner.deleteCustomType('${type.id}')" title="Supprimer ce type">×</button>
            </div>
        `).join('');
    }
    
    updateTypesInForms() {
        // Mettre à jour les checkbox dans le formulaire d'ajout de plat
        const typesGroup = document.getElementById('typesGroup');
        typesGroup.innerHTML = this.customTypes.map(type => `
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 5px;">
                <input type="checkbox" name="type" value="${type.id}">
                <span class="color-dot" style="background: ${type.color}; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                ${type.name}
            </label>
        `).join('');
        
        // Régénérer la configuration des repas avec les nouveaux types
        this.generateMealsConfig();
    }
    
    getTypeOptions() {
        const options = [
            { value: 'tous', label: '📋 Tous types', color: '#718096' },
            { value: 'aucun', label: '🚫 Ne pas proposer de plat', color: '#a0aec0' }
        ];
        
        // Ajouter les types personnalisés
        const typeOptions = this.customTypes.map(type => ({
            value: type.id,
            label: type.name,
            color: type.color
        }));
        
        return [...options, ...typeOptions];
    }
    
    addDish(e) {
        e.preventDefault();
        
        // Récupérer les saisons sélectionnées
        const selectedSeasons = [];
        document.querySelectorAll('input[name="season"]:checked').forEach(checkbox => {
            selectedSeasons.push(checkbox.value);
        });
        
        // Récupérer les types sélectionnés
        const selectedTypes = [];
        document.querySelectorAll('input[name="type"]:checked').forEach(checkbox => {
            selectedTypes.push(checkbox.value);
        });
        
        if (selectedSeasons.length === 0) {
            alert('Veuillez sélectionner au moins une saison');
            return;
        }
        
        if (selectedTypes.length === 0) {
            alert('Veuillez sélectionner au moins un type de plat');
            return;
        }
        
        const dish = {
            id: Date.now(),
            name: document.getElementById('dishName').value,
            seasons: selectedSeasons,
            types: selectedTypes
        };
        
        this.favoriteDishes.push(dish);
        this.saveToLocalStorage();
        this.displayFavorites();
        this.analyzeUsedTypes();
        
        // Réinitialiser le formulaire
        e.target.reset();
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        this.showNotification(`✅ Plat "${dish.name}" ajouté !`);
    }
    
    deleteDish(id) {
        const dish = this.favoriteDishes.find(d => d.id === id);
        this.favoriteDishes = this.favoriteDishes.filter(dish => dish.id !== id);
        this.saveToLocalStorage();
        this.displayFavorites();
        this.analyzeUsedTypes();
        
        if (dish) {
            this.showNotification(`✅ Plat "${dish.name}" supprimé !`);
        }
    }
    
    displayFavorites() {
        const container = document.getElementById('favoritesList');
        
        if (this.favoriteDishes.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucun plat favori. Ajoutez-en un !</p>';
            return;
        }
        
        container.innerHTML = this.favoriteDishes.map(dish => `
            <div class="dish-card">
                <h3>${dish.name}</h3>
                <div class="dish-tags">
                    ${dish.seasons.map(season => `
                        <span class="tag">${this.getSeasonLabel(season)}</span>
                    `).join('')}
                    ${dish.types.map(typeId => {
                        const type = this.customTypes.find(t => t.id === typeId);
                        return type ? `
                            <span class="tag type-badge" style="background: ${type.color}; color: white;">
                                ${type.name}
                            </span>
                        ` : '';
                    }).join('')}
                </div>
                <button class="delete-btn" onclick="menuPlanner.deleteDish(${dish.id})">×</button>
            </div>
        `).join('');
    }
    
    generateMealsConfig() {
        const configGrid = document.getElementById('mealsConfig');
        const typeOptions = this.generateTypeOptionsHTML();
        
        configGrid.innerHTML = '';
        
        for (let day of this.daysOfWeek) {
            for (let meal of this.meals) {
                const card = document.createElement('div');
                card.className = 'meal-config-card';
                card.innerHTML = `
                    <h4>${day} - ${meal === 'midi' ? '🍱 Midi' : '🌙 Soir'}</h4>
                    <select class="meal-config-select" id="config-${day}-${meal}" data-day="${day}" data-meal="${meal}">
                        ${typeOptions}
                    </select>
                `;
                configGrid.appendChild(card);
            }
        }
    }
    
    generateTypeOptionsHTML() {
        const options = this.getTypeOptions();
        return options.map(opt => 
            `<option value="${opt.value}" style="color: ${opt.color}">${opt.label}</option>`
        ).join('');
    }
    
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
    
    getMealConfigurations() {
        const configs = {};
        
        for (let day of this.daysOfWeek) {
            for (let meal of this.meals) {
                const select = document.getElementById(`config-${day}-${meal}`);
                if (select) {
                    configs[`${day}-${meal}`] = select.value;
                }
            }
        }
        
        return configs;
    }
    
    rerollMeal(day, meal) {
        if (!this.currentWeekPlan) return;
        
        const season = document.getElementById('weekSeason').value;
        const noLunchWeek = document.getElementById('noLunchWeek').checked;
        const mealConfigs = this.getMealConfigurations();
        const config = mealConfigs[`${day}-${meal}`];
        
        // Si "pas de midi" est coché et que c'est le repas du midi, pas de plat
        if (noLunchWeek && meal === 'midi') {
            this.currentWeekPlan[day][meal] = null;
            this.displayWeeklyPlan();
            return;
        }
        
        // Si config = 'aucun', ne rien faire
        if (config === 'aucun') {
            this.currentWeekPlan[day][meal] = null;
            this.displayWeeklyPlan();
            return;
        }
        
        // Filtrer les plats disponibles
        let availableDishes = this.favoriteDishes.filter(dish => {
            const seasonMatch = season === 'toutes' || dish.seasons.includes(season);
            const typeMatch = config === 'tous' || dish.types.includes(config);
            return seasonMatch && typeMatch;
        });
        
        if (availableDishes.length === 0) {
            alert('Aucun plat disponible pour ce repas avec les critères actuels');
            return;
        }
        
        // Sélectionner un nouveau plat
        let newDish;
        const currentDish = this.currentWeekPlan[day][meal];
        
        if (availableDishes.length === 1) {
            newDish = availableDishes[0];
        } else {
            do {
                const randomIndex = Math.floor(Math.random() * availableDishes.length);
                newDish = availableDishes[randomIndex];
            } while (currentDish && newDish.id === currentDish.id);
        }
        
        this.currentWeekPlan[day][meal] = newDish;
        this.displayWeeklyPlan();
    }
    
    displayWeeklyPlan() {
        const planningSection = document.getElementById('weeklyPlanning');
        const planningGrid = document.getElementById('planningGrid');
        const noLunchWeek = document.getElementById('noLunchWeek').checked;
        
        planningSection.style.display = 'block';
        
        // Supprimer l'ancien indicateur de scroll s'il existe
        const oldHint = document.querySelector('.scroll-hint');
        if (oldHint) oldHint.remove();
        
        // Ajouter un indicateur de scroll sur mobile
        if (window.innerWidth <= 768) {
            const scrollHint = document.createElement('div');
            scrollHint.className = 'scroll-hint';
            scrollHint.innerHTML = '👆 Faites défiler horizontalement →';
            planningSection.insertBefore(scrollHint, planningGrid);
        }
        
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
    }
    
    getSeasonLabel(season) {
        const labels = {
            'printemps': '🌸 Printemps',
            'ete': '☀️ Été',
            'automne': '🍂 Automne',
            'hiver': '❄️ Hiver',
            'toutes': '🌍 Toutes saisons'
        };
        return labels[season] || season;
    }
    
    saveToLocalStorage() {
        localStorage.setItem('favoriteDishes', JSON.stringify(this.favoriteDishes));
    }
    
    saveCustomTypes() {
        localStorage.setItem('customTypes', JSON.stringify(this.customTypes));
    }
}

// Initialisation de l'application
const menuPlanner = new MenuPlanner();