document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newEntryBtn = document.getElementById('new-entry-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const entriesContainer = document.getElementById('entries-container');
    const entryTitle = document.getElementById('entry-title');
    const entryDate = document.getElementById('entry-date');
    const entryContent = document.getElementById('entry-content');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const moodOptions = document.querySelectorAll('.mood-options i');
    const changeProfileBtn = document.getElementById('change-profile-btn');
    const profileUpload = document.getElementById('profile-upload');
    const profileImg = document.getElementById('profile-img');
    const tagInput = document.getElementById('tag-input');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagsDisplay = document.getElementById('tags-display');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const editorToolbar = document.querySelector('.editor-toolbar');
    
    // State variables
    let currentEntryId = null;
    let currentMood = null;
    let currentTags = [];
    let entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    
    // Initialize the app
    function init() {
        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        entryDate.value = today;
        
        // Load profile picture from localStorage if available
        const savedProfilePic = localStorage.getItem('profilePicture');
        if (savedProfilePic) {
            profileImg.src = savedProfilePic;
        }
        
        // Load entries from localStorage
        renderEntries();
        updateStatistics();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        newEntryBtn.addEventListener('click', createNewEntry);
        themeToggle.addEventListener('click', toggleTheme);
        searchInput.addEventListener('input', filterEntries);
        saveBtn.addEventListener('click', saveEntry);
        deleteBtn.addEventListener('click', deleteEntry);
        
        moodOptions.forEach(option => {
            option.addEventListener('click', () => selectMood(option));
        });
        
        // Profile picture functionality
        changeProfileBtn.addEventListener('click', () => {
            profileUpload.click();
        });
        
        profileUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImg.src = e.target.result;
                    // Save to localStorage
                    localStorage.setItem('profilePicture', e.target.result);
                    showNotification('Profile picture updated!');
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Tag functionality
        addTagBtn.addEventListener('click', addTag);
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTag();
        });
        
        // Export/Import functionality
        exportBtn.addEventListener('click', exportData);
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', importData);
        
        // Rich text editor functionality
        editorToolbar.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.parentElement.tagName === 'BUTTON') {
                const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
                const command = button.getAttribute('data-command');
                document.execCommand(command, false, null);
                entryContent.focus();
            }
        });
        
        // Word count functionality
        entryContent.addEventListener('input', updateWordCount);
        
        // Auto-save when typing (with debounce)
        let timeout;
        const autoSaveElements = [entryTitle, entryContent];
        
        autoSaveElements.forEach(element => {
            element.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (currentEntryId) {
                        saveEntry();
                    }
                }, 1000);
            });
        });
    }
    
    // Create a new entry
    function createNewEntry() {
        currentEntryId = Date.now().toString();
        entryTitle.value = '';
        entryContent.innerHTML = '';
        currentTags = [];
        renderTags();
        
        const today = new Date().toISOString().split('T')[0];
        entryDate.value = today;
        
        // Reset mood selection
        currentMood = null;
        moodOptions.forEach(option => option.classList.remove('selected'));
        
        // Remove any selected entry in the list
        const selectedEntry = document.querySelector('.entry-item.selected');
        if (selectedEntry) {
            selectedEntry.classList.remove('selected');
        }
        
        // Focus on title field
        entryTitle.focus();
        
        // Update word count
        updateWordCount();
    }
    
    // Save the current entry
    function saveEntry() {
        if (!entryTitle.value.trim()) {
            showNotification('Please add a title to your entry', true);
            return;
        }
        
        const entry = {
            id: currentEntryId,
            title: entryTitle.value,
            date: entryDate.value,
            content: entryContent.innerHTML,
            tags: currentTags,
            mood: currentMood,
            lastEdited: new Date().toISOString()
        };
        
        // Check if this is a new entry or updating an existing one
        const existingIndex = entries.findIndex(e => e.id === currentEntryId);
        
        if (existingIndex !== -1) {
            // Update existing entry
            entries[existingIndex] = entry;
        } else {
            // Add new entry
            entries.unshift(entry);
            currentEntryId = entry.id;
        }
        
        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(entries));
        
        // Update the UI
        renderEntries();
        updateStatistics();
        
        // Show feedback
        showNotification('Entry saved successfully!');
    }
    
    // Delete the current entry
    function deleteEntry() {
        if (!currentEntryId) {
            showNotification('No entry selected to delete', true);
            return;
        }
        
        if (confirm('Are you sure you want to delete this entry?')) {
            entries = entries.filter(entry => entry.id !== currentEntryId);
            localStorage.setItem('journalEntries', JSON.stringify(entries));
            
            // Clear the editor
            entryTitle.value = '';
            entryContent.innerHTML = '';
            currentEntryId = null;
            currentMood = null;
            currentTags = [];
            moodOptions.forEach(option => option.classList.remove('selected'));
            renderTags();
            
            // Update the UI
            renderEntries();
            updateStatistics();
            updateWordCount();
            
            showNotification('Entry deleted successfully!');
        }
    }
    
    // Render all entries in the sidebar
    function renderEntries() {
        entriesContainer.innerHTML = '';
        
        if (entries.length === 0) {
            entriesContainer.innerHTML = '<p class="no-entries">No entries yet. Start by creating a new one!</p>';
            return;
        }
        
        // Sort entries by date (newest first)
        const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedEntries.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.classList.add('entry-item');
            if (entry.id === currentEntryId) {
                entryElement.classList.add('selected');
            }
            
            const formattedDate = new Date(entry.date).toLocaleDateString();
            // Create a temporary div to extract text from HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = entry.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const contentPreview = textContent.length > 50 
                ? textContent.substring(0, 50) + '...' 
                : textContent;
            
            entryElement.innerHTML = `
                <h3>${entry.title}</h3>
                <p>${contentPreview}</p>
                <div class="entry-date">${formattedDate}</div>
            `;
            
            entryElement.addEventListener('click', () => loadEntry(entry));
            entriesContainer.appendChild(entryElement);
        });
    }
    
    // Load an entry into the editor
    function loadEntry(entry) {
        currentEntryId = entry.id;
        entryTitle.value = entry.title;
        entryDate.value = entry.date;
        entryContent.innerHTML = entry.content;
        
        // Set tags
        currentTags = entry.tags || [];
        renderTags();
        
        // Set mood
        currentMood = entry.mood || null;
        moodOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-mood') === currentMood) {
                option.classList.add('selected');
            }
        });
        
        // Update selected entry in the list
        const entryItems = document.querySelectorAll('.entry-item');
        entryItems.forEach(item => item.classList.remove('selected'));
        
        const selectedEntry = Array.from(entryItems).find(item => {
            return item.querySelector('h3').textContent === entry.title;
        });
        
        if (selectedEntry) {
            selectedEntry.classList.add('selected');
        }
        
        // Update word count
        updateWordCount();
    }
    
    // Filter entries based on search input
    function filterEntries() {
        const searchTerm = searchInput.value.toLowerCase();
        const entryItems = document.querySelectorAll('.entry-item');
        
        entryItems.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const content = item.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || content.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Select a mood for the current entry
    function selectMood(option) {
        moodOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        currentMood = option.getAttribute('data-mood');
        
        // Auto-save when mood is selected if there's an existing entry
        if (currentEntryId) {
            saveEntry();
        }
    }
    
    // Add a tag to the current entry
    function addTag() {
        const tagText = tagInput.value.trim();
        if (tagText && !currentTags.includes(tagText)) {
            currentTags.push(tagText);
            renderTags();
            tagInput.value = '';
            
            // Auto-save if there's an existing entry
            if (currentEntryId) {
                saveEntry();
            }
        }
    }
    
    // Render tags in the editor
    function renderTags() {
        tagsDisplay.innerHTML = '';
        currentTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('tag');
            tagElement.innerHTML = `${tag} <span class="tag-remove" data-tag="${tag}">×</span>`;
            tagsDisplay.appendChild(tagElement);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tagToRemove = e.target.getAttribute('data-tag');
                currentTags = currentTags.filter(t => t !== tagToRemove);
                renderTags();
                
                // Auto-save if there's an existing entry
                if (currentEntryId) {
                    saveEntry();
                }
            });
        });
    }
    
    // Export journal data
    function exportData() {
        const data = {
            entries: entries,
            profilePicture: localStorage.getItem('profilePicture'),
            tags: [...new Set(entries.flatMap(entry => entry.tags || []))]
        };
        
        const dataStr = JSON.stringify(data);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Data exported successfully!');
    }
    
    // Import journal data
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!confirm('Importing data will overwrite your current journal. Continue?')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.entries) {
                    entries = data.entries;
                    localStorage.setItem('journalEntries', JSON.stringify(entries));
                }
                
                if (data.profilePicture) {
                    localStorage.setItem('profilePicture', data.profilePicture);
                    profileImg.src = data.profilePicture;
                }
                
                renderEntries();
                updateStatistics();
                showNotification('Data imported successfully!');
            } catch (error) {
                showNotification('Error importing data. Invalid file format.', true);
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }
    
    // Update statistics display
    function updateStatistics() {
        // Total entries
        document.getElementById('total-entries').textContent = entries.length;
        
        // This month's entries
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const monthEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
        });
        document.getElementById('month-entries').textContent = monthEntries.length;
        
        // Top tags
        const tagCounts = {};
        entries.forEach(entry => {
            if (entry.tags) {
                entry.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const topTagsContainer = document.getElementById('top-tags');
        topTagsContainer.innerHTML = '';
        
        if (topTags.length === 0) {
            topTagsContainer.innerHTML = '<span>No tags yet</span>';
        } else {
            topTags.forEach(([tag, count]) => {
                const tagElement = document.createElement('span');
                tagElement.classList.add('tag');
                tagElement.textContent = `${tag} (${count})`;
                tagElement.style.fontSize = `${12 + count * 2}px`;
                tagElement.addEventListener('click', () => {
                    searchInput.value = tag;
                    filterEntries();
                });
                topTagsContainer.appendChild(tagElement);
            });
        }
    }
    
    // Update word count and reading time
    function updateWordCount() {
        const text = entryContent.textContent || '';
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(words / 200); // Average reading speed
        
        document.getElementById('word-count').textContent = `${words} words`;
        document.getElementById('reading-time').textContent = `${readingTime} min read`;
    }
    
    // Toggle between light and dark theme
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    }
    
    // Show a notification
    function showNotification(message, isError = false) {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.classList.add('notification');
        if (isError) notification.classList.add('error');
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    
    // Initialize the app
    init();
});