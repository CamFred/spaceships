document.addEventListener('DOMContentLoaded', function() {
    let equippedModules = new Set(); // Track equipped modules
    let inventoryModules = []; // Global variable to hold all module objects
    let defaultShipStats = {}; // To store default ship stats

    const inventory = document.getElementById('inventory');
    const moduleStats = document.getElementById('module-stats'); // The element to display module stats

    // Fetch default ship stats from JSON
    fetch('shipStats.json')
        .then(response => response.json())
        .then(data => {
            // Convert array to object for easier manipulation
            data.forEach(stat => {
                defaultShipStats[stat.statName] = stat.defaultValue;
            });
            updateShipStats(); // Initialize ship stats display
        })
        .catch(error => console.error('Error fetching ship stats:', error));

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
        inventory.innerHTML = ''; // Clear current inventory
    
        // Create and display inventory items
        inventoryModules.forEach(moduleObj => {
            if (!equippedModules.has(moduleObj.id)) { // Check using module ID
                let div = createModuleDiv(moduleObj.name, moduleObj.stats, moduleObj.tier, moduleObj.id);
                div.addEventListener('dragstart', handleDragStart);
                inventory.appendChild(div);
            }
        });
    }
    

    function createModuleDiv(moduleName, moduleStats, tier, id) {
        let div = document.createElement('div');
        div.className = 'module';
        div.textContent = moduleName;
        div.setAttribute('data-id', id); // Correctly set the module's ID
        div.draggable = true;
    
        // Replace spaces with hyphens in the tier to create a valid class name
        const tierClass = tier.replace(/\s+/g, '-').toLowerCase();``
        
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
        console.log("Displaying stats for:", moduleName); // Debugging log
        console.log(stats); // Debugging log

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
    
    function updateShipStats() {
        const shipStatsDiv = document.getElementById('ship-stats');
        shipStatsDiv.innerHTML = ''; // Clear previous ship stats
    
        // Copy default ship stats to a new object
        const shipStats = {...defaultShipStats};
    
        // Iterate through equipped modules
        equippedModules.forEach(moduleId => {
            const moduleObj = inventoryModules.find(obj => obj.id === moduleId);
            if (moduleObj && moduleObj.stats) {
                for (const [statName, statValue] of Object.entries(moduleObj.stats)) {
                    if (shipStats.hasOwnProperty(statName)) {
                        shipStats[statName] += statValue;
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

        const moduleId = event.target.getAttribute('data-id'); // Get the module's ID
        console.log("Dragged Module ID: " + moduleId);
    
        event.dataTransfer.setData('text/plain', moduleId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('sourceId', event.target.parentNode.id); // Source module bay or inventory
        event.target.setAttribute('draggable', 'true');

    }
    

    function handleDragOver(event) {
        event.preventDefault(); // Necessary to allow dropping
        event.dataTransfer.dropEffect = 'move';
    }

    function handleModuleBayDrop(event) {
        event.preventDefault();
        const moduleId = parseInt(event.dataTransfer.getData('text/plain').trim());
    
        let targetBay = event.target;
    
        // Ensure the drop target is the module bay itself
        if (!targetBay.classList.contains('module-bay')) {
            targetBay = targetBay.parentNode;
        }
    
        // Check if the module is already equipped in a different bay
        const existingLocation = findModuleLocation(moduleId);
        if (existingLocation && existingLocation !== targetBay) {
            removeModuleFromLocation(moduleId, existingLocation);
        }
    
        // If there's already a module in the target bay, move it back to inventory
        if (targetBay.childNodes.length > 0) {
            let existingModuleId = targetBay.childNodes[0].getAttribute('data-id');
            if (equippedModules.has(parseInt(existingModuleId))) {
                equippedModules.delete(parseInt(existingModuleId));
            }
            targetBay.innerHTML = ''; // Clear the bay
        }
    
        // Add new module to the bay
        const moduleObj = inventoryModules.find(obj => obj.id === moduleId);
        if (moduleObj) {
            const moduleDiv = createModuleDiv(moduleObj.name, moduleObj.stats, moduleObj.tier, moduleObj.id);
            moduleDiv.setAttribute('data-id', moduleObj.id.toString()); // Set module ID as a data attribute
            targetBay.appendChild(moduleDiv);
            equippedModules.add(moduleObj.id); // Track modules by ID
            updateInventoryDisplay(); // Refresh the inventory display
            updateShipStats(); // Update ship stats
        }
    }
    
    
            // Function to find the current location of a module
        function findModuleLocation(moduleId) {
            let location = null;
            document.querySelectorAll('.module-bay').forEach(bay => {
                bay.childNodes.forEach(child => {
                    if (parseInt(child.getAttribute('data-id')) === moduleId) {
                        location = bay;
                    }
                });
            });
            return location;
        }

        // Function to remove a module from its current location
        function removeModuleFromLocation(moduleId, location) {
            location.childNodes.forEach(child => {
                if (parseInt(child.getAttribute('data-id')) === moduleId) {
                    location.removeChild(child);
                }
            });
            equippedModules.delete(moduleId);
        }
    
    
        function handleInventoryDrop(event) {
            event.preventDefault();
            const moduleId = parseInt(event.dataTransfer.getData('text/plain').trim());
        
            // Find the module object by its ID
            const moduleObj = inventoryModules.find(obj => obj.id === moduleId);
        
            // Check if the module is currently equipped
            if (moduleObj && equippedModules.has(moduleObj.id)) {
                // Remove the module from its current location
                const moduleLocation = findModuleLocation(moduleId);
                if (moduleLocation) {
                    removeModuleFromLocation(moduleId, moduleLocation);
                }
        
                // Update the equipped modules tracking and the display
                equippedModules.delete(moduleObj.id);
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
