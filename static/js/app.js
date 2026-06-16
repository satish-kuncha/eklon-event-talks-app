document.addEventListener('DOMContentLoaded', () => {
    // State
    let updates = [];
    let activeTypeFilter = 'all';
    let searchQuery = '';
    let selectedUpdate = null;
    let selectedHashtags = new Set();

    // DOM Elements
    const updatesGrid = document.getElementById('updates-grid');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    
    // Stats
    const statTotal = document.getElementById('stat-total');
    const statChecked = document.getElementById('stat-checked');
    const toastContainer = document.getElementById('toast-container');

    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const publishTweetBtn = document.getElementById('publish-tweet-btn');
    const autoShortenBtn = document.getElementById('auto-shorten-btn');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const tagChips = document.querySelectorAll('.tag-chip');
    
    // Modal Source Previews
    const modalSourceDate = document.getElementById('modal-source-date');
    const modalSourceBadge = document.getElementById('modal-source-badge');
    const modalSourceText = document.getElementById('modal-source-text');
    
    // Twitter Preview Card Elements
    const xPreviewText = document.getElementById('x-preview-text');
    const xPreviewUrl = document.getElementById('x-preview-url');

    // Fetch and Load Updates
    async function loadUpdates(forceRefresh = false) {
        setLoading(true);
        try {
            const url = forceRefresh ? '/api/releases?refresh=true' : '/api/releases';
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success || data.updates) {
                updates = data.updates || [];
                renderStats(updates.length, data.last_fetched);
                filterAndRender();
                
                if (forceRefresh) {
                    showToast('Successfully refreshed latest release notes!');
                }
            } else {
                showToast(data.error || 'Failed to fetch release notes', 'error');
            }
        } catch (error) {
            console.error('Error fetching updates:', error);
            showToast('Network error while fetching release notes', 'error');
        } finally {
            setLoading(false);
        }
    }

    // Set Loading State
    function setLoading(isLoading) {
        if (isLoading) {
            loader.classList.remove('hidden');
            updatesGrid.classList.add('hidden');
            emptyState.classList.add('hidden');
            refreshIcon.classList.add('spinning');
            refreshBtn.disabled = true;
        } else {
            loader.classList.add('hidden');
            updatesGrid.classList.remove('hidden');
            refreshIcon.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Toast Notifications
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
                <span>${message}</span>
            </div>
        `;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Render Stats
    function renderStats(totalCount, lastChecked) {
        statTotal.textContent = totalCount;
        if (lastChecked) {
            // Display only time or date beautifully
            const dateStr = lastChecked.split(' ')[1] || lastChecked;
            statChecked.textContent = dateStr;
        }
    }

    // Filter and Render updates grid
    function filterAndRender() {
        const query = searchQuery.toLowerCase().trim();
        const filtered = updates.filter(update => {
            const matchesType = activeTypeFilter === 'all' || update.type.toLowerCase() === activeTypeFilter.toLowerCase();
            const matchesSearch = update.text.toLowerCase().includes(query) || 
                                  update.type.toLowerCase().includes(query) ||
                                  update.date.toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            updatesGrid.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            updatesGrid.classList.remove('hidden');
            
            updatesGrid.innerHTML = filtered.map(update => {
                const typeClass = update.type.toLowerCase();
                const isLong = update.text.length > 250;
                return `
                    <div class="update-card" data-id="${update.id}">
                        <div class="card-header">
                            <div class="card-meta">
                                <span class="badge ${typeClass}">${update.type}</span>
                                <span class="card-date">${update.date}</span>
                            </div>
                            <div class="card-actions">
                                <button class="copy-action-btn" title="Copy update text to clipboard" onclick="window.copyToClipboard('${update.id}', this)">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                                <button class="tweet-action-btn" title="Compose Tweet for this update" onclick="window.openTweetModal('${update.id}')">
                                    <i class="fa-brands fa-x-twitter"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body ${isLong ? 'collapsed' : ''}" id="body-${update.id}">
                            ${update.html}
                        </div>
                        ${isLong ? `
                        <button class="read-more-btn" onclick="window.toggleCardReadMore('${update.id}', this)">
                            <span>Read More</span> <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        ` : ''}
                        <div class="card-footer">
                            <a href="${update.link}" target="_blank" class="original-link">
                                View official documentation <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Tweet Helper Logic
    window.openTweetModal = function(updateId) {
        selectedUpdate = updates.find(u => u.id === updateId);
        if (!selectedUpdate) return;

        // Reset hashtag chip selections
        selectedHashtags.clear();
        tagChips.forEach(chip => chip.classList.remove('active'));

        // Prepare initial content
        modalSourceDate.textContent = selectedUpdate.date;
        modalSourceBadge.textContent = selectedUpdate.type;
        modalSourceBadge.className = `badge ${selectedUpdate.type.toLowerCase()}`;
        modalSourceText.textContent = selectedUpdate.text;

        // Draft custom tweet:
        // Try to keep it clean and within bounds
        let previewText = selectedUpdate.text;
        if (previewText.length > 180) {
            previewText = previewText.substring(0, 180) + '...';
        }
        
        const initialTweetText = `📢 BigQuery Update (${selectedUpdate.date})\n\n[${selectedUpdate.type}] ${previewText}\n\nRead more: ${selectedUpdate.link}`;
        
        tweetTextarea.value = initialTweetText;
        updateCharCounter();
        updateXPreview();
        
        // Show modal
        tweetModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    function closeTweetModal() {
        tweetModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        selectedUpdate = null;
    }

    function updateCharCounter() {
        const text = tweetTextarea.value;
        charCounter.textContent = text.length;
        
        if (text.length > 280) {
            charCounter.parentElement.classList.add('danger');
            publishTweetBtn.disabled = true;
        } else {
            charCounter.parentElement.classList.remove('danger');
            publishTweetBtn.disabled = false;
        }
    }

    function updateXPreview() {
        xPreviewText.textContent = tweetTextarea.value;
        if (selectedUpdate) {
            try {
                const domain = new URL(selectedUpdate.link).hostname;
                xPreviewUrl.textContent = domain;
            } catch (e) {
                xPreviewUrl.textContent = 'docs.cloud.google.com';
            }
        }
    }

    // Listeners for Modal
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    tweetTextarea.addEventListener('input', () => {
        updateCharCounter();
        updateXPreview();
    });

    // Hashtag Chips Selection
    tagChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.getAttribute('data-tag');
            let text = tweetTextarea.value;

            if (selectedHashtags.has(tag)) {
                // Remove hashtag
                selectedHashtags.delete(tag);
                chip.classList.remove('active');
                // Clean up from text
                text = text.replace(new RegExp(`\\s*${tag}`, 'g'), '');
            } else {
                // Add hashtag
                selectedHashtags.add(tag);
                chip.classList.add('active');
                // Append
                text = text.trim() + ' ' + tag;
            }

            tweetTextarea.value = text;
            updateCharCounter();
            updateXPreview();
        });
    });

    // Twitter Web Intent Publish
    publishTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.length > 280) {
            showToast('Tweet exceeds X/Twitter limit of 280 characters!', 'error');
            return;
        }

        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
        closeTweetModal();
        showToast('Redirected to Twitter/X!');
    });

    // Filter Buttons click handler
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTypeFilter = btn.getAttribute('data-type');
            filterAndRender();
        });
    });

    // Search Input keyup handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterAndRender();
    });

    // Refresh Button click handler
    refreshBtn.addEventListener('click', () => loadUpdates(true));

    // Copy to Clipboard Logic
    window.copyToClipboard = function(updateId, buttonElement) {
        const update = updates.find(u => u.id === updateId);
        if (!update) return;

        navigator.clipboard.writeText(update.text).then(() => {
            showToast('Text copied to clipboard!');
            
            // Temporary checkmark icon replacement for clipboard feedback
            if (buttonElement) {
                const originalIcon = buttonElement.innerHTML;
                buttonElement.innerHTML = '<i class="fa-solid fa-check" style="color: var(--badge-feature);"></i>';
                buttonElement.disabled = true;
                setTimeout(() => {
                    buttonElement.innerHTML = originalIcon;
                    buttonElement.disabled = false;
                }, 1500);
            }
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showToast('Failed to copy text', 'error');
        });
    };

    // Export to CSV Logic
    exportCsvBtn.addEventListener('click', () => {
        // Filter updates exactly how they are currently displayed
        const query = searchQuery.toLowerCase().trim();
        const filtered = updates.filter(update => {
            const matchesType = activeTypeFilter === 'all' || update.type.toLowerCase() === activeTypeFilter.toLowerCase();
            const matchesSearch = update.text.toLowerCase().includes(query) || 
                                  update.type.toLowerCase().includes(query) ||
                                  update.date.toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            showToast('No updates to export', 'error');
            return;
        }

        // Generate CSV content
        const headers = ['Date', 'Type', 'Content', 'Link'];
        
        const csvRows = [
            headers.join(',') // Join headers
        ];

        filtered.forEach(update => {
            // Escape double quotes and wrap content in quotes to handle commas
            const dateEscaped = `"${update.date.replace(/"/g, '""')}"`;
            const typeEscaped = `"${update.type.replace(/"/g, '""')}"`;
            const textEscaped = `"${update.text.replace(/"/g, '""')}"`;
            const linkEscaped = `"${update.link.replace(/"/g, '""')}"`;
            
            csvRows.push([dateEscaped, typeEscaped, textEscaped, linkEscaped].join(','));
        });

        const csvContent = "\uFEFF" + csvRows.join('\n'); // Add UTF-8 BOM for Excel formatting
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_release_notes_${activeTypeFilter}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Successfully exported to CSV!');
    });

    // Close modal on outside click
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Esc key close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !tweetModal.classList.contains('hidden')) {
            closeTweetModal();
        }
    });

    // Card Read More Toggle logic
    window.toggleCardReadMore = function(updateId, button) {
        const body = document.getElementById(`body-${updateId}`);
        if (!body) return;
        
        const isCollapsed = body.classList.toggle('collapsed');
        if (isCollapsed) {
            button.innerHTML = '<span>Read More</span> <i class="fa-solid fa-chevron-down"></i>';
            body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            button.innerHTML = '<span>Read Less</span> <i class="fa-solid fa-chevron-up"></i>';
        }
    };

    // Auto-Shorten Tweet composer text to fit 280 characters
    autoShortenBtn.addEventListener('click', () => {
        if (!selectedUpdate) return;
        
        const hashtags = Array.from(selectedHashtags).join(' ');
        const dateStr = `📢 BigQuery Update (${selectedUpdate.date})\n\n`;
        const typeStr = `[${selectedUpdate.type}] `;
        const linkStr = `\n\nRead more: ${selectedUpdate.link}`;
        const tagsStr = hashtags ? `\n\n${hashtags}` : '';
        
        const reservedLength = dateStr.length + typeStr.length + linkStr.length + tagsStr.length;
        const maxBodyLength = 280 - reservedLength;
        
        if (maxBodyLength <= 0) {
            showToast('Auto-shorten failed: hashtags & metadata exceed 280 limit!', 'error');
            return;
        }
        
        let desc = selectedUpdate.text;
        if (desc.length > maxBodyLength) {
            desc = desc.substring(0, maxBodyLength - 3).trim() + '...';
        }
        
        const shortenedTweetText = `${dateStr}${typeStr}${desc}${tagsStr}${linkStr}`;
        tweetTextarea.value = shortenedTweetText;
        updateCharCounter();
        updateXPreview();
        showToast('Tweet text auto-shortened!');
    });

    // Initial Load
    loadUpdates();
});
