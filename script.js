document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle');

    function setTheme(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '☀️';
            themeToggleBtn.setAttribute('aria-label', 'Açık temaya geç');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            themeToggleBtn.innerHTML = '🌙';
            themeToggleBtn.setAttribute('aria-label', 'Koyu temaya geç');
            localStorage.setItem('theme', 'light');
        }
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let initialThemeIsDark = false;
    if (savedTheme) {
        initialThemeIsDark = (savedTheme === 'dark');
    } else {
        initialThemeIsDark = prefersDark;
    }
    setTheme(initialThemeIsDark);

    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = body.classList.contains('dark-mode');
        setTheme(!isCurrentlyDark);
    });
    
    
    // ----------------------------------------------------
    // GÜNCELLENMİŞ KODLAR BURADAN BAŞLIYOR
    // ----------------------------------------------------

    // 5. YENİ: Google Apps Script API URL'miz
    // ----------------------------------------------------
    // DİKKAT: Önceki adımdaki Google Apps Script'i oluşturup URL'yi buraya yapıştırmalısın.
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLS97R0r9w49nu3F7qjrVcx299BI_e6q80RqjHn7T6solm4ZtwjTphTlkisNmRXrBd/exec';

    // 6. GEREKLİ DİĞER HTML ELEMENTLERİNİ SEÇME
    // ----------------------------------------------------
    const candidateList = document.getElementById('candidate-list');
    const cardTemplate = document.getElementById('candidate-card-template');
    const compareButton = document.getElementById('compare-button');
    const sortBySelect = document.getElementById('sort-by');
    const filterByScoreSelect = document.getElementById('filter-by-score');
    
    // Detay Modalı elementleri
    const modalContainer = document.getElementById('modal-container');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalImage = document.getElementById('modal-image');
    const modalName = document.getElementById('modal-name');
    const modalInterests = document.getElementById('modal-interests');
    const modalScore = document.getElementById('modal-score');
    const modalEmail = document.getElementById('modal-email');
    const modalPhone = document.getElementById('modal-phone');

    // YENİ: Karşılaştırma Modalı elementleri
    const compareModalContainer = document.getElementById('compare-modal-container');
    const compareModalCloseBtn = document.getElementById('compare-modal-close');
    const compareGridContent = document.getElementById('compare-grid-content');

    // YENİ: AI Detayları için Modal elementleri
    const modalAiGuclu = document.querySelector('#modal-ai-guclu p');
    const modalAiRiskler = document.querySelector('#modal-ai-riskler p');
    const modalAiGerekce = document.querySelector('#modal-ai-gerekce p');

    // Seçilen adayları ve tüm veriyi tutmak için
    let selectedCandidates = [];
    let allCandidatesData = []; // Tüm aday verisini burada saklayacağız
    const MAX_COMPARE_LIMIT = 10;

    // 7. YARDIMCI FONKSİYONLAR
    // ----------------------------------------------------
    
    /**
     * Adayın profil resmini belirler.
     * Öncelik: Adayın kendi yüklediği resim.
     * Değilse, cinsiyete göre varsayılan resim.
     * @param {object} candidate - Aday nesnesi
     * @returns {string} - Resim URL'si
     */
    function getAvatar(candidate) {
        // 1. Öncelik: Base64 formatındaki resim verisi var mı diye kontrol et.
        if (candidate.fotograf_base64 && candidate.fotograf_base64.startsWith('data:image')) {
            return candidate.fotograf_base64;
        }

        // 2. Base64 resim yoksa, cinsiyete göre varsayılan avatarı kullan.
        if (candidate.cinsiyetiniz === 'Kadın' || candidate.cinsiyetiniz === 'Kız') {
            return 'icons/default-avatar-female.png';
        }
        
        // Varsayılan olarak veya 'Erkek' ise erkek avatarı
        return 'icons/default-avatar-male.png';
    }

    /**
     * AI puanına göre CSS sınıfını döndürür.
     */
    function getScoreClass(score) {
        const numericScore = parseInt(score, 10);
        if (isNaN(numericScore)) return 'score-red';
        if (numericScore <= 49) return 'score-red';
        if (numericScore <= 69) return 'score-yellow';
        return 'score-green';
    }

    // 8. ANA FONKSİYONLAR (Filtreleme, Sıralama, Kart Oluşturma)
    // ----------------------------------------------------

    /**
     * Mevcut filtrelere ve sıralama seçeneğine göre adayları işler ve görüntüler.
     */
    function applyFiltersAndSort() {
        // 1. Değerlendirilmiş adayları filtrele (puanı olanlar)
        let processedCandidates = allCandidatesData.filter(c => c.aIGenelSkor != null && String(c.aIGenelSkor).trim() !== '');

        // 2. Puana göre filtrele
        const scoreFilter = filterByScoreSelect.value;
        if (scoreFilter !== 'all') {
            processedCandidates = processedCandidates.filter(c => {
                const score = parseInt(c.aIGenelSkor, 10);
                if (scoreFilter === 'high') return score >= 70;
                if (scoreFilter === 'medium') return score >= 50 && score <= 69;
                if (scoreFilter === 'low') return score <= 49;
                return true;
            });
        }

        // 3. Sırala
        const sortBy = sortBySelect.value;
        processedCandidates.sort((a, b) => {
            if (sortBy === 'score-desc') {
                return parseInt(b.aIGenelSkor, 10) - parseInt(a.aIGenelSkor, 10);
            } else if (sortBy === 'score-asc') {
                return parseInt(a.aIGenelSkor, 10) - parseInt(b.aIGenelSkor, 10);
            } else if (sortBy === 'name-asc') {
                return a.adSoyad.localeCompare(b.adSoyad);
            }
            return 0;
        });

        // 4. Sonuçları ekrana yansıt
        displayCandidates(processedCandidates);
    }

    /**
     * Veri dizisini alır ve HTML kartlarını oluşturup listeye ekler. (Sadece Görüntüleme)
     * @param {Array<object>} candidates - Görüntülenecek aday nesnelerinden oluşan dizi
     */
    function displayCandidates(candidates) {
        candidateList.innerHTML = ''; // Listeyi temizle

        if (candidates.length === 0) {
             candidateList.innerHTML = '<p class="loading-message">Bu kriterlere uyan aday bulunamadı.</p>';
             return;
        }

        candidates.forEach(candidate => {
            const card = cardTemplate.content.cloneNode(true).children[0];

            const image = card.querySelector('.card-image');
            const name = card.querySelector('.card-name');
            const interests = card.querySelector('.card-interests');
            const scoreBadge = card.querySelector('.score-badge');
            const checkbox = card.querySelector('.candidate-select');

            image.src = getAvatar(candidate);
            name.textContent = candidate.adSoyad;
            interests.textContent = candidate.tecrubenOlanTeknolojiler;
            scoreBadge.textContent = candidate.aIGenelSkor;
            
            const candidateId = candidate.timestamp; 
            checkbox.value = candidateId;
            checkbox.checked = selectedCandidates.includes(candidateId);

            scoreBadge.classList.add(getScoreClass(candidate.aIGenelSkor));

            card.addEventListener('click', () => openModalById(candidateId));
            
            checkbox.addEventListener('click', (event) => {
                event.stopPropagation();
                handleCandidateSelection(checkbox, candidateId);
            });

            candidateList.appendChild(card);
        });
    }
    
    /**
     * Gelen aday ID'sine göre modalı (popup) doldurur ve gösterir.
     */
    function openModalById(candidateId) {
        const candidate = allCandidatesData.find(c => c.timestamp === candidateId);
        if (!candidate) return;

        modalImage.src = getAvatar(candidate);
        modalName.textContent = candidate.adSoyad;
        modalInterests.textContent = candidate.tecrubenOlanTeknolojiler;
        modalScore.textContent = candidate.aIGenelSkor;
        
        modalScore.className = 'score-badge';
        modalScore.classList.add(getScoreClass(candidate.aIGenelSkor));
        
        const email = candidate.email;
        const phone = candidate.phone;

        if (email) {
            modalEmail.href = `mailto:${email}`;
            modalEmail.textContent = email;
            modalEmail.style.display = 'block';
        } else {
            modalEmail.textContent = 'E-posta adresi bulunamadı.';
            modalEmail.href = '#';
            modalEmail.style.display = 'block';
        }

        if (phone) {
            modalPhone.href = `tel:${phone}`;
            modalPhone.textContent = phone;
            modalPhone.style.display = 'block';
        } else {
            modalPhone.textContent = 'Telefon numarası bulunamadı.';
            modalPhone.href = '#';
            modalPhone.style.display = 'block';
        }

        // YENİ: AI Detaylarını doldur
        modalAiGuclu.textContent = candidate.aIGucluYanlar || 'Bilgi yok.';
        modalAiRiskler.textContent = candidate.aIRiskler || 'Bilgi yok.';
        modalAiGerekce.textContent = candidate.aIKisaGerekce || 'Bilgi yok.';
        
        // Modalı göster
        modalContainer.classList.add('show');
    }

    /**
     * Detay modalını gizler.
     */
    function closeModal() {
        modalContainer.classList.remove('show');
    }

    /**
     * YENİ: Karşılaştırma modalını açar.
     */
    function openCompareModal() {
        compareModalContainer.classList.add('show');
    }

    /**
     * YENİ: Karşılaştırma modalını gizler.
     */
    function closeCompareModal() {
        compareModalContainer.classList.remove('show');
    }

    // Modal'ı kapatma olaylarını ekle
    modalCloseBtn.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            closeModal();
        }
    });
    // YENİ: Karşılaştırma modalı kapatma olayları
    compareModalCloseBtn.addEventListener('click', closeCompareModal);
    compareModalContainer.addEventListener('click', (event) => {
        if (event.target === compareModalContainer) {
            closeCompareModal();
        }
    });

    // 9. OLAY DİNLEYİCİLERİ VE SAYFAYI BAŞLATMA
    // ----------------------------------------------------
    
    /**
     * Checkbox tıklandığında seçilen aday listesini günceller.
     */
    function handleCandidateSelection(checkbox, candidateId) {
        if (checkbox.checked) {
            if (selectedCandidates.length < MAX_COMPARE_LIMIT) {
                selectedCandidates.push(candidateId);
            } else {
                checkbox.checked = false;
                alert(`Karşılaştırma için en fazla ${MAX_COMPARE_LIMIT} aday seçebilirsiniz.`);
            }
        } else {
            selectedCandidates = selectedCandidates.filter(id => id !== candidateId);
        }
        updateCompareButton();
    }

    /**
     * Karşılaştır butonunun metnini ve durumunu günceller.
     */
    function updateCompareButton() {
        const count = selectedCandidates.length;
        
        if (count > 0) {
            compareButton.textContent = `Seçilenleri Karşılaştır (${count})`;
            compareButton.disabled = false;
        } else {
            compareButton.textContent = 'Seçilenleri Karşılaştır (0)';
            compareButton.disabled = true;
        }
    }
    
    // Karşılaştır butonuna tıklama olayı
    compareButton.addEventListener('click', () => {
        handleCompareRequest();
    });

    // YENİ: Filtreleme ve sıralama menülerine olay dinleyicileri ekle
    sortBySelect.addEventListener('change', applyFiltersAndSort);
    filterByScoreSelect.addEventListener('change', applyFiltersAndSort);

    /**
     * Seçilen adayları alıp karşılaştırma modalını modern sütun formatında doldurur ve açar.
     */
    function handleCompareRequest() {
        if (selectedCandidates.length === 0) return;

        const candidatesToCompare = allCandidatesData.filter(candidate =>
            selectedCandidates.includes(candidate.timestamp)
        );

        compareGridContent.innerHTML = ''; // Önceki içeriği temizle

        candidatesToCompare.forEach(candidate => {
            const column = document.createElement('div');
            column.className = 'compare-column';

            const scoreClass = getScoreClass(candidate.aIGenelSkor);
            const technologies = candidate.tecrubenOlanTeknolojiler || 'N/A';
            const strengths = candidate.aIGucluYanlar || 'N/A';
            const risks = candidate.aIRiskler || 'N/A';
            const recommendation = candidate.aIoneri || 'N/A';

            column.innerHTML = `
                <img src="${getAvatar(candidate)}" alt="${candidate.adSoyad}" class="compare-avatar">
                <h3>${candidate.adSoyad}</h3>
                
                <div class="compare-attribute">
                    <label>AI Puanı</label>
                    <span class="score-badge ${scoreClass}">${candidate.aIGenelSkor}</span>
                </div>
                
                <div class="compare-attribute">
                    <label>AI Önerisi</label>
                    <p>${recommendation}</p>
                </div>

                <div class="compare-attribute">
                    <label>Güçlü Yanlar</label>
                    <p>${strengths}</p>
                </div>

                <div class="compare-attribute">
                    <label>Riskler</label>
                    <p>${risks}</p>
                </div>

                <div class="compare-attribute">
                    <label>Teknolojiler</label>
                    <p>${technologies}</p>
                </div>
            `;
            compareGridContent.appendChild(column);
        });

        openCompareModal();
    }

    /**
     * Google Apps Script API'sinden aday verilerini çeker ve ekranı doldurur.
     */
    async function fetchCandidates() {
        const loaderContainer = document.getElementById('loader-container');
        loaderContainer.style.display = 'flex';

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL);
            if (!response.ok) {
                throw new Error(`HTTP hatası! Durum: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.error) {
                 throw new Error(`API Hatası: ${data.error}`);
            }
            
            allCandidatesData = data; 
            applyFiltersAndSort(); // <-- DEĞİŞİKLİK: Artık bu fonksiyonu çağırıyoruz

        } catch (error) {
            console.error('Veri çekme hatası:', error);
            candidateList.innerHTML = '<p class="error-message">Adaylar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        } finally {
            loaderContainer.style.display = 'none';
        }
    }

    async function init() {
        await fetchCandidates();

        const refreshButton = document.getElementById('refresh-button');

        refreshButton.addEventListener('click', () => {
            const loaderContainer = document.getElementById('loader-container');
            loaderContainer.style.display = 'flex';

            const n8nWebhookUrl = 'https://short-fly-68.hooks.n8n.cloud/webhook-test/86789385-940b-46d8-bceb-7a1ab0f4caa0';

            fetch(n8nWebhookUrl, { method: 'POST' })
                .then(response => {
                    if (response.ok) {
                        // Wait a bit for n8n to process and then reload the candidates
                        setTimeout(() => {
                            fetchCandidates();
                        }, 5000); // 5 seconds delay
                    } else {
                        throw new Error('n8n workflow could not be triggered.');
                    }
                })
                .catch(error => {
                    console.error('Error triggering n8n workflow:', error);
                    candidateList.innerHTML = '<p class="error-message">CVler yenilenemedi. Lütfen daha sonra tekrar deneyin.</p>';
                    loaderContainer.style.display = 'none';
                });
        });

        const googleSheetLink = document.getElementById('google-sheet-link');
        const googleFormLink = document.getElementById('google-form-link');

        googleSheetLink.addEventListener('click', () => {
            window.open('https://docs.google.com/spreadsheets/d/1pIlRUZ3ZI3PQgGNAks97l5pbGR1hXQPljpApnK1BW0s/edit?gid=1478236436#gid=1478236436', '_blank');
        });

        googleFormLink.addEventListener('click', () => {
            window.open('https://docs.google.com/forms/d/e/1FAIpQLScdpPrUJ_Le-P25aIwUHAPVFqKX3T-jVAyviThaj_zuw48tjQ/viewform', '_blank');
        });

        const logoutButton = document.getElementById('logout-button');
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    init();

});