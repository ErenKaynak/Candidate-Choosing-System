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

    // 5. GÜNCELLENMİŞ: API URL'leri
    // ----------------------------------------------------
    // Google Apps Script URL'si (Veri Okuma)
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLS97R0r9w49nu3F7qjrVcx299BI_e6q80RqjHn7T6solm4ZtwjTphTlkisNmRXrBd/exec';

    // --> YENİ: n8n Webhook URL'si (ngrok + n8n yolu)
    const N8N_TRIGGER_URL = 'https://postnodular-mui-incomprehensibly.ngrok-free.app/webhook/c4165332-bb5d-4663-b117-719a54996811'; // ngrok URL + Webhook Yolu


    // 6. GEREKLİ DİĞER HTML ELEMENTLERİNİ SEÇME
    // ----------------------------------------------------
    const candidateList = document.getElementById('candidate-list');
    const cardTemplate = document.getElementById('candidate-card-template');
    const compareButton = document.getElementById('compare-button');
    const sortBySelect = document.getElementById('sort-by');
    const filterByScoreSelect = document.getElementById('filter-by-score');
    const loaderContainer = document.getElementById('loader-container'); // Loader'ı seçtik

    // Detay Modalı elementleri
    const modalContainer = document.getElementById('modal-container');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalImage = document.getElementById('modal-image');
    const modalName = document.getElementById('modal-name');
    const modalInterests = document.getElementById('modal-interests');
    const modalScore = document.getElementById('modal-score');
    const modalEmail = document.getElementById('modal-email');
    const modalPhone = document.getElementById('modal-phone');
    const modalAiGuclu = document.querySelector('#modal-ai-guclu p');
    const modalAiRiskler = document.querySelector('#modal-ai-riskler p');
    const modalAiGerekce = document.querySelector('#modal-ai-gerekce p');


    // Karşılaştırma Modalı elementleri
    const compareModalContainer = document.getElementById('compare-modal-container');
    const compareModalCloseBtn = document.getElementById('compare-modal-close');
    const compareGridContent = document.getElementById('compare-grid-content');

    // Seçilen adayları ve tüm veriyi tutmak için
    let selectedCandidates = [];
    let allCandidatesData = [];
    const MAX_COMPARE_LIMIT = 6;

    // 7. YARDIMCI FONKSİYONLAR
    // ----------------------------------------------------

    function getAvatar(candidate) {
        if (candidate.fotograf_base64 && candidate.fotograf_base64.startsWith('data:image')) {
            return candidate.fotograf_base64;
        }
        if (candidate.cinsiyetiniz === 'Kadın' || candidate.cinsiyetiniz === 'Kız') {
            return 'icons/default-avatar-female.png';
        }
        return 'icons/default-avatar-male.png';
    }

    function getScoreClass(score) {
        const numericScore = parseInt(score, 10);
        if (isNaN(numericScore)) return 'score-red';
        if (numericScore <= 49) return 'score-red';
        if (numericScore <= 69) return 'score-yellow';
        return 'score-green';
    }

    // 8. ANA FONKSİYONLAR (Filtreleme, Sıralama, Kart Oluşturma)
    // ----------------------------------------------------

    function applyFiltersAndSort() {
        let processedCandidates = allCandidatesData.filter(c => c.aIGenelSkor != null && String(c.aIGenelSkor).trim() !== '');

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

        const sortBy = sortBySelect.value;
        processedCandidates.sort((a, b) => {
            if (sortBy === 'score-desc') {
                return parseInt(b.aIGenelSkor, 10) - parseInt(a.aIGenelSkor, 10);
            } else if (sortBy === 'score-asc') {
                return parseInt(a.aIGenelSkor, 10) - parseInt(b.aIGenelSkor, 10);
            } else if (sortBy === 'name-asc') {
                // localeCompare'i null/undefined kontrolü ile kullan
                const nameA = a.adSoyad || '';
                const nameB = b.adSoyad || '';
                return nameA.localeCompare(nameB);
            }
            return 0;
        });

        displayCandidates(processedCandidates);
    }

    function displayCandidates(candidates) {
        candidateList.innerHTML = '';

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
            name.textContent = candidate.adSoyad || 'İsim Yok';
            interests.textContent = candidate.tecrubenOlanTeknolojiler || 'Belirtilmemiş';
            scoreBadge.textContent = candidate.aIGenelSkor || 'N/A';

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

    function openModalById(candidateId) {
        const candidate = allCandidatesData.find(c => c.timestamp === candidateId);
        if (!candidate) return;

        modalImage.src = getAvatar(candidate);
        modalName.textContent = candidate.adSoyad || 'İsim Yok';
        modalInterests.textContent = candidate.tecrubenOlanTeknolojiler || 'Belirtilmemiş';
        modalScore.textContent = candidate.aIGenelSkor || 'N/A';

        modalScore.className = 'score-badge';
        modalScore.classList.add(getScoreClass(candidate.aIGenelSkor));

        const email = candidate.email; // Apps Script'in bu alanı döndürdüğünden emin ol
        const phone = candidate.phone; // Apps Script'in bu alanı döndürdüğünden emin ol

        if (email) {
            modalEmail.href = `mailto:${email}`;
            modalEmail.style.display = 'block';
             // --> GÜNCELLENDİ: Sadece e-postayı göster, link metni değil
            modalEmail.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;
        } else {
            modalEmail.style.display = 'none';
        }

        if (phone) {
            modalPhone.href = `tel:${phone}`;
            modalPhone.style.display = 'block';
            // --> GÜNCELLENDİ: Sadece telefonu göster, link metni değil
            modalPhone.innerHTML = `<i class="fas fa-phone"></i> ${phone}`;
        } else {
            modalPhone.style.display = 'none';
        }

        // AI Detaylarını doldur (Apps Script'ten gelen temizlenmiş adlarla)
        modalAiGuclu.textContent = candidate.aIGucluYanlar || 'Bilgi yok.';
        modalAiRiskler.textContent = candidate.aIRiskler || 'Bilgi yok.';
        modalAiGerekce.textContent = candidate.aIKisaGerekce || 'Bilgi yok.';

        modalContainer.classList.add('show');
    }

    function closeModal() {
        modalContainer.classList.remove('show');
    }

    function openCompareModal() {
        compareModalContainer.classList.add('show');
    }

    function closeCompareModal() {
        compareModalContainer.classList.remove('show');
    }

    modalCloseBtn.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) closeModal();
    });
    compareModalCloseBtn.addEventListener('click', closeCompareModal);
    compareModalContainer.addEventListener('click', (event) => {
        if (event.target === compareModalContainer) closeCompareModal();
    });

    // 9. OLAY DİNLEYİCİLERİ VE SAYFAYI BAŞLATMA
    // ----------------------------------------------------

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

    function updateCompareButton() {
        const count = selectedCandidates.length;
        compareButton.textContent = `Karşılaştır (${count}/${MAX_COMPARE_LIMIT})`;
        compareButton.disabled = count === 0;
    }

    compareButton.addEventListener('click', () => {
        handleCompareRequest(); // Karşılaştırma modalını açan fonksiyon
    });

    sortBySelect.addEventListener('change', applyFiltersAndSort);
    filterByScoreSelect.addEventListener('change', applyFiltersAndSort);

    /**
     * Seçilen adayları alıp karşılaştırma modalını doldurur ve açar.
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
            // --> GÜNCELLENDİ: Apps Script'ten gelen temizlenmiş adları kullan
            const technologies = candidate.tecrubenOlanTeknolojiler || 'N/A';
            const strengths = candidate.aIGucluYanlar || 'N/A';
            const risks = candidate.aIRiskler || 'N/A';
            const recommendation = candidate.aIoneri || 'N/A';
            const score = candidate.aIGenelSkor || 'N/A';
            const name = candidate.adSoyad || 'İsim Yok';

            column.innerHTML = `
                <img src="${getAvatar(candidate)}" alt="${name}" class="compare-avatar">
                <h3>${name}</h3>

                <div class="compare-attribute">
                    <label>AI Puanı</label>
                    <span class="score-badge ${scoreClass}">${score}</span>
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
        loaderContainer.style.display = 'flex'; // Loader'ı göster

        try {
            console.log('Veri çekiliyor:', GOOGLE_SCRIPT_URL);
            const response = await fetch(GOOGLE_SCRIPT_URL);
            console.log('Yanıt alındı:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP hatası! Durum: ${response.status}`);
            }
            const data = await response.json();
            console.log('Veri JSON olarak ayrıştırıldı.');

            if (data.error) {
                 throw new Error(`API Hatası: ${data.error}`);
            }

            allCandidatesData = data;
            applyFiltersAndSort(); // Filtrele, sırala ve görüntüle

        } catch (error) {
            console.error('Veri çekme hatası:', error);
            candidateList.innerHTML = '<p class="error-message">Adaylar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        } finally {
            loaderContainer.style.display = 'none'; // Loader'ı gizle
        }
    }

   async function init() {
        await fetchCandidates(); // İlk yükleme
        updateCompareButton(); // Butonun başlangıç durumunu ayarla

        const refreshButton = document.getElementById('refresh-button');
        const googleSheetLink = document.getElementById('google-sheet-link');
        const googleFormLink = document.getElementById('google-form-link');
        const logoutButton = document.getElementById('logout-button');

        // --> GÜNCELLENDİ: Yenile Butonu Olay Dinleyicisi (ngrok ile)
        refreshButton.addEventListener('click', async () => {
            // URL'nin geçerli olup olmadığını basitçe kontrol et
             if (!N8N_TRIGGER_URL || !N8N_TRIGGER_URL.startsWith('https://')) {
                 alert('Lütfen script.js dosyasındaki N8N_TRIGGER_URL değişkenini geçerli ngrok URL\'niz ile güncelleyin.');
                 return;
            }

            loaderContainer.style.display = 'flex';
            refreshButton.disabled = true;
            refreshButton.textContent = 'Tetikleniyor...';

            try {
                // n8n webhook'unu tetikle (POST isteği)
                console.log('n8n Webhook URL\'sine POST isteği gönderiliyor:', N8N_TRIGGER_URL);
                const triggerResponse = await fetch(N8N_TRIGGER_URL, { method: 'POST' });
                console.log('n8n yanıtı alındı:', triggerResponse.status);


                if (!triggerResponse.ok) {
                    // n8n yanıtı başarısızsa (örn: 404, 500) hata fırlat
                    throw new Error(`n8n webhook tetiklenemedi. Durum: ${triggerResponse.status}`);
                }

                // n8n'in işlemi bitirmesi için bekleme süresi (milisaniye)
                const waitTime = 15000; // 15 saniye bekle (Workflow süresine göre ayarla)
                console.log(`n8n workflow başarıyla tetiklendi. Veri yenileme için ${waitTime/1000} saniye bekleniyor...`);
                refreshButton.textContent = 'İşleniyor...';

                await new Promise(resolve => setTimeout(resolve, waitTime));

                console.log("Veriler yeniden çekiliyor...");
                await fetchCandidates(); // Veri okuma API'sinden güncel veriyi çek
                console.log("Veriler başarıyla yenilendi.");


            } catch (error) {
                console.error('n8n tetikleme veya veri yenileme hatası:', error);
                 alert(`Aday verileri yenilenirken bir hata oluştu: ${error.message}. Lütfen konsolu kontrol edin.`);

            } finally {
                // Her durumda loader'ı gizle ve butonu tekrar aktif et
                loaderContainer.style.display = 'none';
                refreshButton.disabled = false;
                refreshButton.textContent = 'Yenile';
            }
        });

        // Diğer Linkler ve Butonlar
        googleSheetLink.addEventListener('click', () => {
            window.open('https://docs.google.com/spreadsheets/d/1pIlRUZ3ZI3PQgGNAks97l5pbGR1hXQPljpApnK1BW0s/edit?gid=1478236436#gid=1478236436', '_blank');
        });

        googleFormLink.addEventListener('click', () => {
            window.open('https://docs.google.com/forms/d/e/1FAIpQLScdpPrUJ_Le-P25aIwUHAPVFqKX3T-jVAyviThaj_zuw48tjQ/viewform', '_blank');
        });

        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    init(); // Sayfayı başlat

}); // DOMContentLoaded sonu