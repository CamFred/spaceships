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
                let div = createModuleDiv(moduleObj.name, moduleObj.stats);
                div.addEventListener('dragstart', handleDragStart);
                inventory.appendChild(div);
            }
        });
    }

    function createModuleDiv(moduleName, moduleStats) {
        let div = document.createElement('div');
        div.className = 'module';
        div.textContent = moduleName;
        div.draggable = true;
    
        // Add click event listener to display module stats
        div.addEventListener('click', () => {
            displayModuleStats(moduleName, moduleStats);
        });
    
        return div;
    }

    function displayModuleStats(moduleName, stats) {
        // Clear previous module stats
        moduleStats.innerHTML = '';
    
        // Create a heading for the module name
        const moduleNameHeading = document.createElement('h3');
        moduleNameHeading.textContent = moduleName;
        moduleStats.appendChild(moduleNameHeading);
    
        // Create a div for displaying the stats
        const statsDiv = document.createElement('div');
        statsDiv.textContent = JSON.stringify(stats, null, 2);
        moduleStats.appendChild(statsDiv);
    }
    

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
        console.log("Received: " + moduleName);
        let targetBay = event.target;
    
        // Ensure the drop target is the module bay itself
        if (!targetBay.classList.contains('module-bay')) {
            targetBay = targetBay.parentNode;
        }
    
        // Check if a module is already equipped in the bay
        if (targetBay.childNodes.length > 0) {
            let existingModule = targetBay.childNodes[0];
            equippedModules.delete(existingModule.textContent.trim());
            targetBay.removeChild(existingModule);
        }
    
        // Find the module object from the inventoryModules array
        const moduleObj = inventoryModules.find(obj => obj.name === moduleName);
    
        if (moduleObj) {
            // Create a new module element for the bay
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'module';
            moduleDiv.textContent = moduleName;
            moduleDiv.draggable = true;
    
            // Add click event listener to display module stats
            moduleDiv.addEventListener('click', () => {
                displayModuleStats(moduleName, moduleObj.stats);
            });
    
            // Append the new module element to the bay
            targetBay.appendChild(moduleDiv);
    
            // Add the new module to the set of equipped modules
            equippedModules.add(moduleName); // Use module name for tracking
    
            // Re-fetch modules and update the inventory display
            fetchModulesAndUpdateDisplay();
        }
    }
    
    
    function handleInventoryDrop(event) {
        event.preventDefault();
        const moduleName = event.dataTransfer.getData('text/plain').trim();
        const sourceId = event.dataTransfer.getData('sourceId');
    
        if (sourceId && sourceId !== 'inventory') {
            equippedModules.delete(moduleName);
            let sourceElement = document.getElementById(sourceId);
            if (sourceElement) {
                sourceElement.innerHTML = '';
            }

            // Re-fetch modules and update the inventory display
            fetchModulesAndUpdateDisplay();
        }
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
