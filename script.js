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
      
      // Afficher les types personnalisés
      this.displayCustomTypes();
      
      // Afficher les plats favoris
      this.displayFavorites();
      
      // Générer la configuration des repas
      this.generateMealsConfig();
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
      
      // Réinitialiser le formulaire
      e.target.reset();
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  }
  
  deleteDish(id) {
      this.favoriteDishes = this.favoriteDishes.filter(dish => dish.id !== id);
      this.saveToLocalStorage();
      this.displayFavorites();
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
      const mealConfigs = this.getMealConfigurations();
      const config = mealConfigs[`${day}-${meal}`];
      
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
      
      planningSection.style.display = 'block';
      
      planningGrid.innerHTML = this.daysOfWeek.map(day => `
          <div class="day-card">
              <h3>${day}</h3>
              ${this.meals.map(meal => {
                  const mealData = this.currentWeekPlan[day][meal];
                  return `
                      <div class="meal">
                          <div class="meal-header">
                              <span class="meal-type">${meal === 'midi' ? '🍱 Midi' : '🌙 Soir'}</span>
                              <button class="reroll-btn" onclick="menuPlanner.rerollMeal('${day}', '${meal}')">
                                  🔄 Reroll
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
                              <div class="meal-name no-meal">🚫 Aucun plat prévu</div>
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