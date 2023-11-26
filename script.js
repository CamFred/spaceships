document.addEventListener('DOMContentLoaded', function() {
    let equippedModules = new Set(); // Track equipped modules
    let inventoryModules = []; // Global variable to hold all module objects
    const inventory = document.getElementById('inventory');
    const moduleStats = document.getElementById('module-stats'); // The element to display module stats

    // Function to fetch modules and update the inventory display
    function fetchModulesAndUpdateDisplay() {
        fetch('modules.json')
            .then(response => response.json())
            .then(data => {
                inventoryModules = data; // Update the global variable
                updateInventoryDisplay(); // Initialize inventory display
            })
            .catch(error => console.error('Error fetching module data:', error));
    }

    // Initial fetch and update
    fetchModulesAndUpdateDisplay();

    function updateInventoryDisplay() {
        console.log("Updating inventory display");
        console.log("Equipped Modules:", Array.from(equippedModules));

        inventory.innerHTML = ''; // Clear current inventory

        // Create and display inventory items
        inventoryModules.forEach(moduleObj => {
            if (!equippedModules.has(moduleObj.name)) {
                // Determine the tier of the module (you'll need a way to do this)
                // For example, assuming you have a 'tier' property in each module object
                const tier = moduleObj.tier;
        
                // Call createModuleDiv with the tier parameter
                let div = createModuleDiv(moduleObj.name, moduleObj.stats, tier);
                div.addEventListener('dragstart', handleDragStart);
                inventory.appendChild(div);
            }
        });
    }

    function createModuleDiv(moduleName, moduleStats, tier) {
        let div = document.createElement('div');
        div.className = 'module';
        div.textContent = moduleName;
        div.draggable = true;
    
        // Replace spaces with hyphens in the tier to create a valid class name
        const tierClass = tier.replace(/\s+/g, '-').toLowerCase();
        
        // Add a class based on the modified tier
        //console.log("I am adding module-tier-" + tierClass);
        div.classList.add(`module-${tierClass}`);
    
        // Add click event listener to display module stats
        div.addEventListener('click', () => {
            displayModuleStats(moduleName, moduleStats, tier);
        });
    
        return div;
    }
    

    function displayModuleStats(moduleName, stats, tier) {
        // Clear previous module stats
        moduleStats.innerHTML = '';
    
        // Create a heading for the module name
        const moduleNameHeading = document.createElement('h3');
        moduleNameHeading.textContent = moduleName;
        moduleStats.appendChild(moduleNameHeading);
    
        // Create a div for displaying the stats
        const statsDiv = document.createElement('div');
    
        // Display the tier information
        const tierParagraph = document.createElement('p');
        tierParagraph.textContent = `Tier: ${tier}`;
        statsDiv.appendChild(tierParagraph);
    
        // Loop through the stats object and display each stat
        for (const [statName, statValue] of Object.entries(stats)) {
            const statLine = document.createElement('p');
            const formattedStatName = prettyText(statName);
            statLine.textContent = `${formattedStatName}: ${statValue}`;
            statsDiv.appendChild(statLine);
        }
    
        moduleStats.appendChild(statsDiv);
    }
    
    // Function to update the ship's stats based on equipped modules
function updateShipStats() {
    const shipStatsDiv = document.getElementById('ship-stats');
    shipStatsDiv.innerHTML = ''; // Clear previous ship stats

    // Initialize an object to store ship stats
    const shipStats = {};

    // Iterate through equipped modules
    equippedModules.forEach(moduleName => {
        const moduleObj = inventoryModules.find(obj => obj.name === moduleName);
        if (moduleObj && moduleObj.stats) {
            // Iterate through the stats of the module and add them to shipStats
            for (const [statName, statValue] of Object.entries(moduleObj.stats)) {
                // Use the statName as the key and add the statValue to shipStats
                if (shipStats.hasOwnProperty(statName)) {
                    // If the stat already exists, add the new value
                    shipStats[statName] += statValue;
                } else {
                    // If the stat doesn't exist, create it with the new value
                    shipStats[statName] = statValue;
                }
            }
        }
    });

    // Create a list of ship stats and their values
    const shipStatsList = document.createElement('ul');
    for (const [statName, statValue] of Object.entries(shipStats)) {
        const listItem = document.createElement('li');
        const formattedStatName = prettyText(statName);
        listItem.textContent = `${formattedStatName}: ${statValue}`;
        shipStatsList.appendChild(listItem);
    }

    shipStatsDiv.appendChild(shipStatsList);
}

// Call the updateShipStats function initially to display ship stats
updateShipStats();



    function handleDragStart(event) {
        const moduleName = event.target.textContent;
        console.log("Dragged Module: " + moduleName);

        event.dataTransfer.setData('text/plain', event.target.textContent);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('sourceId', event.target.parentNode.id); // Source module bay or inventory
        
        // Set the dragged module as draggable
        event.target.setAttribute('draggable', 'true');
    }
    

    function handleDragOver(event) {
        event.preventDefault(); // Necessary to allow dropping
        event.dataTransfer.dropEffect = 'move';
    }

    function handleModuleBayDrop(event) {
        event.preventDefault();
        const moduleName = event.dataTransfer.getData('text/plain').trim();
        let targetBay = event.target;
    
        // Ensure the drop target is the module bay itself
        if (!targetBay.classList.contains('module-bay')) {
            targetBay = targetBay.parentNode;
        }
    
        // If there's already a module in the bay, move it back to inventory
        if (targetBay.childNodes.length > 0) {
            let existingModule = targetBay.childNodes[0].textContent.trim();
            if (equippedModules.has(existingModule)) {
                equippedModules.delete(existingModule);
            }
            targetBay.innerHTML = ''; // Clear the bay
            updateInventoryDisplay();  // Update the inventory to show the returned module
        }
    
        // Add new module to the bay
        const moduleObj = inventoryModules.find(obj => obj.name === moduleName);
        if (moduleObj) {
            const moduleDiv = createModuleDiv(moduleName, moduleObj.stats, moduleObj.tier);
            targetBay.appendChild(moduleDiv);
            equippedModules.add(moduleName);
            updateInventoryDisplay();  // Refresh the inventory display
            updateShipStats();
        }
    }
    
    
    
    
    function handleInventoryDrop(event) {
        event.preventDefault();
        const moduleName = event.dataTransfer.getData('text/plain').trim();
    
        // Move module back to inventory
        if (equippedModules.has(moduleName)) {
            document.querySelectorAll('.module-bay').forEach(bay => {
                bay.childNodes.forEach(child => {
                    if (child.textContent.trim() === moduleName) {
                        bay.removeChild(child);
                    }
                });
            });
    
            equippedModules.delete(moduleName);
            updateInventoryDisplay();
            updateShipStats();
        }
    }

    function prettyText(text) {
        // Use regular expression to match lowercase letters followed by uppercase letters
        // and insert a space before the uppercase letter, then capitalize the first letter
        return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase());
    }

    // Function to set up the event listeners for the module bay elements
    function setUpModuleBayEventListeners() {
        document.querySelectorAll('.module-bay').forEach(bay => {
            bay.addEventListener('dragover', handleDragOver);
            bay.addEventListener('drop', handleModuleBayDrop);
            bay.addEventListener('dragstart', handleDragStart); // Add this line
        });
    }

    // Call the function to set up the event listeners for the module bays
    setUpModuleBayEventListeners(); // Add this line

    // Enable inventory to accept drops (unequip modules)
    inventory.addEventListener('dragover', handleDragOver);
    inventory.addEventListener('drop', handleInventoryDrop);

    // Set up module bays
    document.querySelectorAll('.module-bay').forEach(bay => {
        bay.addEventListener('dragover', handleDragOver);
        bay.addEventListener('drop', handleModuleBayDrop);
    });
});
