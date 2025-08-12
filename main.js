// 🧪 FAKE USER CONFIG (replace with real auth later)
const currentUser = {
  username: "jdoe",
  isAdmin: true,     // Has admin rights
  canEdit: true,     // Can add/edit entries
  canView: true      // Can view IP list
};

// ✅ Role checking helper
function hasAccess(level) {
  switch (level) {
    case "admin": return currentUser.isAdmin;
    case "edit": return currentUser.canEdit;
    case "view": return currentUser.canView;
    default: return false;
  }
}

let ipData = [];

// Data is now loaded on-demand by performSearch()

function renderResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = `bg-white rounded-lg shadow p-6 dark:bg-gray-800`;

        let detailsHtml = '';
        for (const [key, value] of Object.entries(item)) {
            // Skip rendering the 'ip' again as it's in the header
            if (key === 'ip') continue;
            
            const displayValue = (value === null || value === 'Null') ? 
                '<span class="text-gray-500">Not in use</span>' :
                value;

            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            detailsHtml += `<p class="text-sm"><strong class="font-semibold">${displayKey}:</strong> ${displayValue}</p>`;
        }

       card.innerHTML = `
           <div class="flex justify-between items-center mb-2">
               <h3 class="text-lg font-bold text-gray-900 dark:text-white">${item.ip}</h3>
               <span class="text-xs font-semibold py-1 px-2 rounded-full ${item.used ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}">
                   ${item.used ? 'In Use' : 'Available'}
               </span>
           </div>
           <div class="space-y-1 text-gray-700 dark:text-gray-300">${detailsHtml}</div>
           <div class="mt-4 flex justify-end">
               <button class="edit-btn bg-primary-blue text-white px-3 py-1 rounded hover:bg-secondary-teal text-sm" data-ip="${item.ip}">Edit</button>
           </div>
       `;
       resultsContainer.appendChild(card);

       card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(item));
    });
}

const searchInput = document.getElementById('searchInput');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');

function refreshView() {
    const searchTerm = searchInput.value.toLowerCase();
    const placeholder = document.getElementById('search-placeholder');
    const noResults = document.getElementById('no-results');
    const resultsContainer = document.getElementById('results');

    resultsContainer.innerHTML = ''; // Clear previous results

    if (searchTerm) {
        placeholder.classList.add('hidden');
        const filteredData = ipData.filter(item => {
            const ipMatch = item.ip.toLowerCase().includes(searchTerm);
            const accountMatch = item.account_number && item.account_number.toString().toLowerCase().includes(searchTerm);
            return ipMatch || accountMatch;
        });

        if (filteredData.length > 0) {
            noResults.classList.add('hidden');
            renderResults(filteredData);
        } else {
            noResults.classList.remove('hidden');
        }
    } else {
        placeholder.classList.remove('hidden');
        noResults.classList.add('hidden');
    }
}

function performSearch() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="text-gray-500">Searching...</div>';

    if (!hasAccess("view")) {
        resultsContainer.innerHTML = `<div class="text-red-400 font-semibold">Access denied.</div>`;
        return;
    }

    fetch('ips.json', { cache: 'no-cache' })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            ipData = data; // Update global data with the latest from the server
            refreshView(); // Render the view based on the new data
        })
        .catch(err => {
            console.error("Failed to load or process ips.json:", err);
            resultsContainer.innerHTML = `<div class="text-red-400">Error loading IP data.</div>`;
        });
}

submitBtn.addEventListener('click', performSearch);

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    performSearch();
});

// Tab switching logic
const tabs = {
    search: document.getElementById('search-tab'),
    addIp: document.getElementById('add-ip-tab'),
};

const tabContents = {
    search: document.getElementById('search'),
    addIp: document.getElementById('add-ip'),
};

function switchTab(activeTabKey) {
    Object.keys(tabs).forEach(tabKey => {
        const tab = tabs[tabKey];
        const content = tabContents[tabKey];
        
        // Deactivate all tabs first
        // Deactivate tab: remove active styles, add hover styles
        tab.classList.remove('text-primary-blue', 'border-primary-blue');
        tab.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300');
        tab.setAttribute('aria-selected', 'false');
        content.classList.add('hidden');
    });

    // Then, activate the correct one
    const activeTab = tabs[activeTabKey];
    const activeContent = tabContents[activeTabKey];

    // Activate tab: add active styles, remove hover styles
    activeTab.classList.add('text-primary-blue', 'border-primary-blue');
    activeTab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300');
    activeTab.setAttribute('aria-selected', 'true');
    activeContent.classList.remove('hidden');
}

tabs.search.addEventListener('click', () => switchTab('search'));
tabs.addIp.addEventListener('click', () => switchTab('addIp'));

// Set default tab
switchTab('search');

// "Add IP" form logic
const addIpForm = document.getElementById('addIpForm');
const usedSelect = document.getElementById('used');
const accountNumberField = document.getElementById('accountNumberField');
const typeField = document.getElementById('typeField');
const macField = document.getElementById('macField');
const boundField = document.getElementById('boundField');
const typeSelect = document.getElementById('type');
const boundSelect = document.getElementById('bound');

usedSelect.addEventListener('change', () => {
    const isUsed = usedSelect.value === 'true';
    accountNumberField.classList.toggle('hidden', !isUsed);
    typeField.classList.toggle('hidden', !isUsed);
    macField.classList.toggle('hidden', !isUsed);
    boundField.classList.toggle('hidden', !isUsed);
    if(isUsed) {
        typeSelect.dispatchEvent(new Event('change'));
    }
});

typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'Reserved') {
        boundSelect.value = 'true';
        boundSelect.disabled = true;
    } else {
        boundSelect.disabled = false;
    }
});

addIpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addIpForm);
    const ip = formData.get('ip');
    const subnet = formData.get('subnet');
    const gateway = formData.get('gateway');
    const used = formData.get('used') === 'true';
    const accountNumber = formData.get('account_number');
    const type = formData.get('type');
    let mac = formData.get('mac');
    const bound = formData.get('bound') === 'true';

    if (!ip || !subnet || !gateway) {
        alert('Please fill out all required fields.');
        return;
    }

    if (used) {
        if (!accountNumber || !type) {
            alert('Please provide an account number and type for used IPs.');
            return;
        }
        if (!mac) {
            alert('Please provide a MAC address for used IPs.');
            return;
        }
        mac = mac.replace(/[:-]/g, '').toLowerCase();
        if (!/^[0-9a-f]{12}$/.test(mac)) {
            alert('Invalid MAC address format. It must be 12 hexadecimal characters.');
            return;
        }
    }

    if (ipData.some(item => item.ip === ip)) {
        alert('This IP address already exists.');
        return;
    }

    const newIp = {
        ip,
        subnet,
        gateway,
        used,
        date_used: null,
        account_number: null,
        release_date: null,
        last_account: null,
        type: null,
        mac: null,
        bound: false,
        last_edited: "SERVER_DATE_NOW",
    };

    if (used) {
        newIp.account_number = accountNumber;
        newIp.type = type;
        newIp.mac = mac;
        newIp.bound = bound;
        newIp.date_used = "SERVER_DATE_NOW";
    }

    console.log('New IP data:', newIp);
    ipData.push(newIp);
    saveIpData().then(() => {
        addIpForm.reset();
        accountNumberField.classList.add('hidden');
        typeField.classList.add('hidden');
        macField.classList.add('hidden');
        boundField.classList.add('hidden');
        const addSuccessMessage = document.getElementById('addSuccessMessage');
        addSuccessMessage.classList.remove('hidden');
        setTimeout(() => {
            addSuccessMessage.classList.add('hidden');
            switchTab('search');
            // After switching, clear the search to show the placeholder
            searchInput.value = '';
            refreshView();
        }, 2000);
    });
});

// "Edit IP" Modal Logic
const editIpModal = document.getElementById('editIpModal');
const editModalContent = document.getElementById('editModalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
let originalIpData = null;

function openEditModal(item) {
    originalIpData = { ...item }; // Store a copy for "Undo"
    editModalContent.innerHTML = createEditForm(item);
    attachModalEventListeners(item);
    editIpModal.classList.remove('hidden');
}

function closeEditModal() {
    editIpModal.classList.add('hidden');
    editModalContent.innerHTML = '';
    originalIpData = null;
}

closeModalBtn.addEventListener('click', closeEditModal);

function createEditForm(item) {
    return `
        <form id="modalEditForm" class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">Editing IP: <strong class="font-bold">${item.ip}</strong></p>
            <div>
                <label for="modal_used" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Used</label>
                <select id="modal_used" name="used" class="mt-1 block w-full p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="false" ${!item.used ? 'selected' : ''}>Not Used</option>
                    <option value="true" ${item.used ? 'selected' : ''}>Used</option>
                </select>
            </div>
            <div class="modal-edit-options" ${!item.used ? 'style="display: none;"' : ''}>
                <div>
                    <label for="modal_account_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</label>
                    <input type="text" id="modal_account_number" name="account_number" class="mt-1 block w-full p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${item.account_number || ''}">
                </div>
                <div>
                    <label for="modal_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <select id="modal_type" name="type" class="mt-1 block w-full p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="Reserved" ${item.type === 'Reserved' ? 'selected' : ''}>Reserved</option>
                        <option value="Static" ${item.type === 'Static' ? 'selected' : ''}>Static</option>
                    </select>
                </div>
                <div>
                    <label for="modal_mac" class="block text-sm font-medium text-gray-700 dark:text-gray-300">MAC Address</label>
                    <input type="text" id="modal_mac" name="mac" class="mt-1 block w-full p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${item.mac || ''}">
                </div>
                <div>
                    <label for="modal_bound" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Bound</label>
                    <select id="modal_bound" name="bound" class="mt-1 block w-full p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" ${item.type === 'Reserved' ? 'disabled' : ''}>
                        <option value="false" ${!item.bound ? 'selected' : ''}>False</option>
                        <option value="true" ${item.bound ? 'selected' : ''}>True</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-end space-x-4 pt-4">
                <button type="button" id="undoBtn" class="bg-primary-gray text-white px-4 py-2 rounded hover:bg-gray-600">Undo</button>
                <button type="submit" class="bg-primary-blue text-white px-4 py-2 rounded hover:bg-secondary-teal">Save Changes</button>
            </div>
        </form>
    `;
}

function attachModalEventListeners(item) {
    const form = editModalContent.querySelector('#modalEditForm');
    if (!form) return; // Guard against errors

    const usedSelect = form.querySelector('#modal_used');
    const typeSelect = form.querySelector('#modal_type');
    const boundSelect = form.querySelector('#modal_bound');
    const editOptions = form.querySelector('.modal-edit-options');
    const undoBtn = form.querySelector('#undoBtn');

    usedSelect.addEventListener('change', () => {
        editOptions.style.display = usedSelect.value === 'true' ? 'block' : 'none';
    });

    typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'Reserved') {
            boundSelect.value = 'true';
            boundSelect.disabled = true;
        } else {
            boundSelect.disabled = false;
        }
    });

    undoBtn.addEventListener('click', () => {
        openEditModal(originalIpData); // Re-render the form with original data
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const used = formData.get('used') === 'true';
        const ipIndex = ipData.findIndex(i => i.ip === item.ip);
        if (ipIndex === -1) return;

        const updatedItem = ipData[ipIndex];

        if (used) {
            let mac = formData.get('mac');
            if (!mac) {
                alert('Please provide a MAC address for used IPs.');
                return;
            }
            mac = mac.replace(/[:-]/g, '').toLowerCase();
            if (!/^[0-9a-f]{12}$/.test(mac)) {
                alert('Invalid MAC address format. It must be 12 hexadecimal characters.');
                return;
            }
            updatedItem.used = true;
            updatedItem.account_number = formData.get('account_number');
            updatedItem.type = formData.get('type');
            updatedItem.mac = mac;
            if (updatedItem.type === 'Reserved') {
                updatedItem.bound = true;
            } else {
                updatedItem.bound = formData.get('bound') === 'true';
            }
            updatedItem.date_used = updatedItem.date_used || "SERVER_DATE_NOW";
            updatedItem.release_date = null;
        } else {
            if (updatedItem.used) { // If it was previously used
                updatedItem.last_account = updatedItem.account_number;
            }
            updatedItem.used = false;
            updatedItem.account_number = null;
            updatedItem.type = null;
            updatedItem.mac = null;
            updatedItem.bound = false;
            updatedItem.date_used = null;
            updatedItem.release_date = "SERVER_DATE_NOW";
        }
        
        updatedItem.last_edited = "SERVER_DATE_NOW";

        console.log('Updated IP data:', updatedItem);
        saveIpData().then(() => {
            const editSuccessMessage = document.getElementById('editSuccessMessageModal');
            editSuccessMessage.classList.remove('hidden');
            setTimeout(() => {
                editSuccessMessage.classList.add('hidden');
                closeEditModal();
                refreshView(); // Refresh the search results to show updated card
            }, 2000);
        });
    });
}

function saveIpData() {
    return fetch('save-ips.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(ipData, null, 2),
    })
    .then(response => response.json())
    .then(updatedData => {
        console.log("Data saved successfully.");
        ipData = updatedData;
        // The calling function will handle re-rendering the view.
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Failed to save IP data.');
    });
}

// Dark Mode Toggle
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleIcon = themeToggleBtn.querySelector('i');

// Check for saved theme preference
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    themeToggleIcon.classList.replace('fa-moon', 'fa-sun');
} else {
    document.documentElement.classList.remove('dark');
    themeToggleIcon.classList.replace('fa-sun', 'fa-moon');
}

themeToggleBtn.addEventListener('click', () => {
    // toggle icons
    themeToggleIcon.classList.toggle('fa-sun');
    themeToggleIcon.classList.toggle('fa-moon');

    // if set via local storage previously
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }

    // if NOT set via local storage previously
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
});