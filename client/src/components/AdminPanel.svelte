    <!-- AdminPanel.svelte -->
    <!-- AdminPanel.svelte -->
    <script>
        // Import necessary functions and components
        import { onMount } from 'svelte';
        import { fly } from 'svelte/transition';
        import { MY_IP } from '../env.js' ;


        let menuItems = [];
        let newItem = {}; // Object to store new item data
        let categories = []; // Array to store unique categories
        let selectedCategory = ''; // Variable to store the selected category
        let selectedItemId = ''; // Variable to store the ID of the selected item for modification
        let selectedItem = {}; // Object to store the selected item for modification
        let imageFile; // Variable to store the selected image file
        let newCategory = {}; // Object to store new category data
        let selectedCategoryId = ''; // Variable to store the ID of the selected category for modification
        let selectedCategoryItem = {}; // Object to store the selected category for modification
        let categoryIconFile; // Variable to store the selected category icon file

        // Define session timeout duration (20 minutes)
        const SESSION_TIMEOUT = 20 * 60 * 1000; // in milliseconds

        let timeoutId; // Variable to store the timeout ID

        // Reset the session timeout on user activity
        function resetSessionTimeout() {
            clearTimeout(timeoutId); // Clear previous timeout
            timeoutId = setTimeout(logout, SESSION_TIMEOUT); // Set new timeout
        }

        // Function to logout the user (redirect to login page)
        function logout() {
            localStorage.removeItem('token'); // Remove token from localStorage
            window.location.href = '/login'; // Redirect to login page
        }


        // Check if the user is authenticated
        const isAuthenticated = () => {
            const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
            return !!token;
        };

        // Redirect to login page if not authenticated
        onMount(() => {
            if (!isAuthenticated()) {
                window.location.href = '/login'; // Redirect to login page
            } else {

                // Start the session timeout countdown
                resetSessionTimeout();
                // Reset session timeout on user activity
                window.addEventListener('mousemove', resetSessionTimeout);
                window.addEventListener('mousedown', resetSessionTimeout);
                window.addEventListener('keypress', resetSessionTimeout);
                fetchMenuItems(); // Fetch menu items if authenticated
                fetchCategories(); // Fetch categories on mount
            }
        });

        async function fetchMenuItems() {
            try {
                const response = await fetch('https://'+ MY_IP +':5000/api/menu');
                if (!response.ok) {
                    throw new Error('Failed to fetch menu items');
                }
                menuItems = await response.json();

                menuItems = menuItems.slice().sort((a, b) => a.order - b.order);

            } catch (error) {
                console.error('Error fetching menu items:', error);
            }
        }

        async function fetchCategories() {
            try {
                const response = await fetch('https://'+ MY_IP +':5000/api/categories');
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                categories = await response.json();
                categories = categories.slice().sort((a, b) => a.order - b.order);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        }

        // Function to handle adding new item
        function addNewItem() {
            const formData = new FormData();
            formData.append('data', JSON.stringify(newItem));
            formData.append('image', imageFile);

            // Send a request to the server to add the new item
            fetch('https://'+ MY_IP +':5000/api/menu/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newItem)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to add new item');
                }
                // Refresh the menu items after adding the new item
                fetchMenuItems();
            })
            .catch(error => {
                console.error('Error adding new item:', error);
            });
        }

        // Function to handle adding new category
        function addNewCategory() {
            const formData = new FormData();
            formData.append('data', JSON.stringify(newCategory));
            formData.append('icon', categoryIconFile);

            // Send a request to the server to add the new category
            fetch('https://'+ MY_IP +':5000/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCategory)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to add new category');
                }
                // Refresh the categories after adding the new category
                fetchCategories();
            })
            .catch(error => {
                console.error('Error adding new category:', error);
            });
        }

        
        // Function to handle updating the selected category
        function updateSelectedCategory() {
            const formData = new FormData();
            formData.append('data', JSON.stringify(selectedCategoryItem));
            formData.append('icon', categoryIconFile);
            // Send a request to the server to update the selected category
            fetch(`https://${MY_IP}:5000/api/categories/${selectedCategoryItem._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedCategoryItem)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update category');
                }
                // Refresh the categories after updating the category
                fetchCategories();
            })
            .catch(error => {
                console.error('Error updating category:', error);
            });
        }

    // Function to handle category icon selection
    function handleCategoryIconUpload(event) {
        categoryIconFile = event.target.files[0];
        const formData = new FormData();
        formData.append('icon', categoryIconFile);

        fetch('https://'+ MY_IP +':5000/api/categories/upload-icon', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.iconUrl) {
                throw new Error('Icon URL not found in response');
            }
            newCategory.iconUrl = data.iconUrl; // Update newCategory's iconUrl
            selectedCategoryItem.iconUrl = data.iconUrl; // Update selectedCategoryItem's iconUrl
        })
        .catch(error => {
            console.error('Error uploading category icon:', error);
        });
    }

    // Function to handle image selection for menu items
    function handleImageUpload(event) {
        const file = event.target.files[0];
        const formData = new FormData();
        imageFile = event.target.files[0];
        formData.append('image', file);

        fetch('https://'+ MY_IP +':5000/api/menu/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.imageUrl) {
                throw new Error('Image URL not found in response');
            }
            newItem.imageUrl = data.imageUrl; // Update newItem's imageUrl
            selectedItem.imageUrl = data.imageUrl; // Update selectedItem's imageUrl
        })
        .catch(error => {
            console.error('Error uploading image:', error);
        });
    }


        // Function to handle deleting the selected category
        function deleteSelectedCategory() {
            if (confirm("Are you sure you want to delete this category?")) {
                // Send a request to the server to delete the selected category
                fetch(`https://${MY_IP}:5000/api/categories/${selectedCategoryItem._id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete category');
                    }
                    // Refresh the categories after deleting the category
                    fetchCategories();
                    // Clear selected category details
                    selectedCategoryId = '';
                    selectedCategoryItem = {};
                })
                .catch(error => {
                    console.error('Error deleting category:', error);
                });
            }
        }
        function selectItemForModification(itemId) {
            selectedItemId = itemId;
            selectedItem = menuItems.find(item => item._id === itemId);
        }
        
        // Function to handle selecting a category for modification
        function selectCategoryForModification(categoryId) {
            selectedCategoryId = categoryId;
            selectedCategoryItem = categories.find(category => category._id === categoryId);
        }
        function deleteSelectedItem() {
            if (confirm("Are you sure you want to delete this item?")) {
                fetch(`https://${MY_IP}:5000/api/menu/${selectedItem._id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete item');
                    }
                    fetchMenuItems();
                    selectedItemId = '';
                    selectedItem = {};
                })
                .catch(error => {
                    console.error('Error deleting item:', error);
                });
            }
        }

        function updateSelectedItem() {
            const formData = new FormData();
            formData.append('data', JSON.stringify(selectedItem));
            formData.append('image', imageFile);

            fetch(`https://${MY_IP}:5000/api/menu/${selectedItem._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedItem)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update item');
                }
                fetchMenuItems();
            })
            .catch(error => {
                console.error('Error updating item:', error);
            });
        }

// Function to update the order of categories in the database
async function updateCategoryOrder(catID, newIndex) {
    try {
        const response = await fetch(`https://${MY_IP}:5000/api/categories/${catID}/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newIndex })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update category order in the database');
        }
        await fetchCategories();
        selectCategoryForModification(catID)

    } catch (error) {
        console.error('Error updating category order:', error);
    }
}

async function updateItemOrder(itemID, newIndex) {
    try {
        const response = await fetch(`https://${MY_IP}:5000/api/menu/${itemID}/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newIndex })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update category order in the database');
        }
        await fetchMenuItems();
        selectItemForModification(itemID);

    } catch (error) {
        console.error('Error updating category order:', error);
    }
}




    </script>
    <style>
    /* Add styles for admin menu page */
    /* Same styling as MenuPage.svelte, adjust as necessary */
    .add-item-card {
        padding: 20px;
        border-radius: 10px;
        background-color: #fff;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        justify-content: left;
        max-width: 300px;
        flex: 1;
    }

    .add-item-card label {
        display: block;
        margin-bottom: 10px;
    }

    .radio-container {
        display: flex;
        margin-bottom: 10px;
    }

    .add-item-card input,
    .add-item-card textarea,
    .add-item-card select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        margin-bottom: 10px;
        box-sizing: border-box;
    }

    .add-item-card button {
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .add-item-card button:hover {
        background-color: #0056b3;
    }

    .container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        max-width: auto;
        gap: 20px; /* Adjust the gap between cards */
    }

    .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .menu-item {
        padding: 20px;
        border-radius: 10px;
        background-color: #fff;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    }

    .menu-item h2 {
        margin-top: 0;
    }

    .menu-item img {
        max-width: 100%;
    }

    .item-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .item-list li {
        cursor: pointer;
        padding: 5px 0;
    }
    .image-container {
    max-width: 300px; /* Adjust the width as needed */
    margin-bottom: 20px; /* Add some space below the image */
    }

    .image-container img {
    max-width: 100%; /* Ensure the image doesn't exceed the container width */
    height: auto; /* Maintain aspect ratio */
    }

    /* Add styles for filter category section */
    .filter-category-section {
        display: flex;
        flex-direction: column;
        margin-bottom: 20px;
    }

    /* Styles for the filter-category and add-item-list within the filter-category-section */
    .filter-category,
    .add-item-list {
        padding: 20px;
        border-radius: 10px;
        background-color: #fff;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
    }

    /* Add styles for item list rows */
    .item-row {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #ccc;
        cursor: pointer;
    }

    .item-row:hover {
        background-color: #f0f0f0;
    }

    .item-row input[type="radio"] {
        margin-right: 10px;
        align-self: flex-start; /* Align radio buttons to the start (left) */
    }

    .item-row span {
        flex-grow: 1;
        align-self: flex-start; /* Align item names to the start (left) */
    }

    /* Add styles for category list rows */
    .category-row {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #ccc;
        cursor: pointer;
    }

    .category-row:hover {
        background-color: #f0f0f0;
    }

    .category-row input[type="radio"] {
        margin-right: 10px;
        align-self: flex-start; /* Align radio buttons to the start (left) */
    }

    .category-row span {
        flex-grow: 1;
        align-self: flex-start; /* Align category names to the start (left) */
    }
    .logo {
        max-width: 45px;
        padding: 10px;
    }


    </style>





    <!-- HTML structure -->
    <div class="container">
        <div class="menu-page">
            <h1>Admin Menu Page</h1>
    
            <!-- Add new item form wrapped in a card -->
            <div class="add-item-card">
            <h2>Add New Item</h2>
            <form on:submit|preventDefault={addNewItem}>
                <label>
                    Category:
                    <select bind:value={newItem.category}>
                        {#each categories as category}
                            <option value={category.name}>{category.name}</option>
                        {/each}
                    </select>
                </label>
                <label>
                    Name:
                    <input type="text" bind:value={newItem.name}>
                </label>
                <label>
                    Description:
                    <textarea rows="3" bind:value={newItem.description}></textarea>
                </label>
                <label>
                    Price:
                    <input type="number" step="0.01" bind:value={newItem.price}>
                </label>
                <label>
                    Available:
                    <input type="checkbox" bind:checked={newItem.available}>
                </label>
                <label>
                    Image:
                    <div class="image-container">
                        <img src={newItem.imageUrl} alt="Selected Item Image" />
                    </div>
                    <input type="file" accept="image/*" name="image" on:change={handleImageUpload}>
                </label>
                <button type="submit">Apply</button>
            </form>
        </div>
    
        <!-- Filter by category
        <div class="filter-category-section">
            <div class="filter-category">
                <h2>Filter by Category</h2>
                <select bind:value={selectedCategory}>
                    <option value="">All</option>
                    {#each categories as category}
                    <option on:click={() => (selectedCategory = categories.find(cat => cat.name === category.name))} value={category}>{category.name}</option>
                    {/each}
                
                </select>
            </div> -->
    
            <div class="add-item-list">
                <h2>Filter by Category</h2>
                <select bind:value={selectedCategory}>
                    {#each categories as category}
                    <option on:click={() => (selectedCategory = categories.find(cat => cat.name === category.name))} value={category}>{category.name}</option>
                    {/each}
                
                </select>
                <!-- Item list -->
                <ul class="add-item-list">
                {#each menuItems.filter(item => item.category === selectedCategory.name || selectedCategory === '') as item}
                    <label class="item-row">
                        <input type="radio" name="selectedItem" value={item._id} checked={selectedItemId === item._id} on:click={() => selectItemForModification(item._id)}>
                        <span>{item.name}</span>
                    </label>
                {/each}
                </ul>
            <!-- Add buttons for reordering categories -->
            {#if selectedCategory != ''}
            <img src="/up.png" alt="Logo" class="logo" on:click={updateItemOrder(selectedItemId,selectedItem.order -1)}>
            <img src="/down.png" alt="Logo" class="logo" on:click={updateItemOrder(selectedItemId,selectedItem.order +1)}>
            {/if}
            </div>
            
    
        <!-- Display selected item for modification -->
        {#if selectedItemId}
        <div class="add-item-card">
            <h2>Modify Item</h2>
            <!-- Form for modifying the selected item -->
            <form on:submit|preventDefault={updateSelectedItem}>
                <label>
                    Name:
                    <input type="text" bind:value={selectedItem.name}>
                </label>
                <label>
                    Description:
                    <textarea rows="3" bind:value={selectedItem.description}></textarea>
                </label>
                <label>
                    Price:
                    <input type="number" step="0.01" bind:value={selectedItem.price}>
                </label>
                <label>
                    Available:
                    <input type="checkbox" bind:checked={selectedItem.available}>
                </label>
                <!-- Container for the image -->
                <div class="image-container">
                    <label>
                        Current Image:
                    </label>
                    <img src={selectedItem.imageUrl} alt="Selected Item Image" />
                </div>
                <!-- Input for updating the image -->
                <label>
                    Update Image:
                    <input type="file" accept="image/*" name="image" on:change={handleImageUpload}>
                </label>
                <!-- Delete button -->
                <button type="button" on:click={deleteSelectedItem}>Delete</button>
                <!-- Submit button -->
                <button type="submit">Apply</button>
            </form>
        </div>
        {/if}
    
        <!-- Add new category form wrapped in a card -->
        <div class="add-item-card">
            <h2>Add New Category</h2>
            <form on:submit|preventDefault={addNewCategory}>
                <label>
                    Name:
                    <input type="text" bind:value={newCategory.name}>
                </label>
                <label>
                    Description:
                    <textarea rows="3" bind:value={newCategory.description}></textarea>
                </label>
                <label>
                    Icon:
                    <input type="file" accept="image/*" name="icon" on:change={handleCategoryIconUpload}>
                </label>
                <button type="submit">Add Category</button>
            </form>
        </div>
    <!-- Filter by category -->
    <div class="filter-category-section">
        <div class="filter-category">
            <!-- Content for Filter by Category -->
            <h2>Select Category</h2>
            <ul class="add-item-list">
                {#each categories as category}
                    <label class="category-row">
                        <input type="radio" name="selectedCategory" value={category._id} checked={selectedCategoryId === category._id} on:change={() => selectCategoryForModification(category._id)}>
                        <span>{category.name}</span>
                    </label>
                {/each}
            </ul>
            <!-- Add buttons for reordering categories -->
            <img src="/up.png" alt="Logo" class="logo" on:click={updateCategoryOrder(selectedCategoryItem._id,selectedCategoryItem.order -1 )}>
            <img src="/down.png" alt="Logo" class="logo" on:click={updateCategoryOrder(selectedCategoryItem._id,selectedCategoryItem.order +1)}>
            <!-- <button type="button" on:click={updateCategoryOrder(selectedCategoryItem._id,selectedCategoryItem.order -1 )}>Move Up</button>
            <button type="button" on:click={updateCategoryOrder(selectedCategoryItem._id,selectedCategoryItem.order +1)}>Move Down</button> -->

        </div>
    </div>

        <!-- Modify existing category form wrapped in a card -->
    {#if selectedCategoryId}
    <div class="add-item-card">
        <h2>Modify Category</h2>
        <form on:submit|preventDefault={updateSelectedCategory}>
            <label>
                Name:
                <input type="text" bind:value={selectedCategoryItem.name}>
            </label>
            <label>
                Description:
                <textarea rows="3" bind:value={selectedCategoryItem.description}></textarea>
            </label>
            <!-- Container for the category icon -->
            <div class="image-container">
                <label>
                    Current Icon:
                </label>
                <img src={selectedCategoryItem.iconUrl} alt="Selected Category Icon" />
            </div>
            <!-- Input for updating the category icon -->
            <label>
                Update Icon:
                <input type="file" accept="image/*" name="icon" on:change={handleCategoryIconUpload}>
            </label>
            <!-- Delete button -->
            <button type="button" on:click={deleteSelectedCategory}>Delete</button>
            <!-- Submit button -->
            <button type="submit">Apply</button>
        </form>
    </div>
    {/if}
        
    </div>
    </div>
