// DOM yüklendiğinde tüm kodumuzun çalışmasını sağlarız
document.addEventListener('DOMContentLoaded', () => {

    // 1. GEREKLİ HTML ELEMENTLERİNİ SEÇME
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // 2. TEMA FONKSİYONLARI
    // ----------------------------------------------------
    
    /**
     * Temayı ayarlar ve tarayıcı hafızasına kaydeder.
     * @param {boolean} isDark - Tema koyu moda mı ayarlanacak?
     */
    function setTheme(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '☀️'; // Buton ikonunu güneşe çevir
            themeToggleBtn.setAttribute('aria-label', 'Açık temaya geç');
            localStorage.setItem('theme', 'dark'); // Tercihi hafızaya kaydet
        } else {
            body.classList.remove('dark-mode');
            themeToggleBtn.innerHTML = '🌙'; // Buton ikonunu aya çevir
            themeToggleBtn.setAttribute('aria-label', 'Koyu temaya geç');
            localStorage.setItem('theme', 'light'); // Tercihi hafızaya kaydet
        }
    }

    // 3. BAŞLANGIÇ TEMASINI AYARLAMA (Sayfa Yüklendiğinde)
    // ----------------------------------------------------
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let initialThemeIsDark = false;
    if (savedTheme) {
        initialThemeIsDark = (savedTheme === 'dark');
    } else {
        initialThemeIsDark = prefersDark;
    }
    setTheme(initialThemeIsDark);


    // 4. BUTON TIKLAMA OLAYINI EKLEME (Event Listener)
    // ----------------------------------------------------
    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = body.classList.contains('dark-mode');
        setTheme(!isCurrentlyDark);
    });
    
    
    // ----------------------------------------------------
    // GÜNCELLENMİŞ KODLAR BURADAN BAŞLIYOR
    // ----------------------------------------------------

    // 5. YENİ: Google Apps Script API URL'miz
    // ----------------------------------------------------
    // "Adım 4.2"de kopyaladığınız URL'yi buraya yapıştırın
    // DİKKAT: Önceki adımdaki Google Apps Script'i oluşturup URL'yi buraya yapıştırmalısın.
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/..../exec'; // <--- BURAYI MUTLAKA DEĞİŞTİRİN

    // 6. GEREKLİ DİĞER HTML ELEMENTLERİNİ SEÇME
    // ----------------------------------------------------
    const candidateList = document.getElementById('candidate-list');
    const cardTemplate = document.getElementById('candidate-card-template');
    const compareButton = document.getElementById('compare-button');
    
    // Modal elementleri
    const modalContainer = document.getElementById('modal-container');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalImage = document.getElementById('modal-image');
    const modalName = document.getElementById('modal-name');
    const modalInterests = document.getElementById('modal-interests');
    const modalScore = document.getElementById('modal-score');
    const modalEmail = document.getElementById('modal-email');
    const modalPhone = document.getElementById('modal-phone');

    // Seçilen adayları ve tüm veriyi tutmak için
    let selectedCandidates = [];
    let allCandidatesData = []; // Tüm aday verisini burada saklayacağız
    const MAX_COMPARE_LIMIT = 10;

    // 7. YARDIMCI FONKSİYONLAR
    // ----------------------------------------------------
    
    /**
     * AI puanına göre CSS sınıfını döndürür (İstek 2)
     */
    function getScoreClass(score) {
        // Gelen skorun bir sayı olduğundan emin olalım
        const numericScore = parseInt(score, 10);
        if (isNaN(numericScore)) return 'score-red'; // Hatalı veriye karşı
        
        if (numericScore <= 49) return 'score-red';
        if (numericScore <= 69) return 'score-yellow';
        return 'score-green';
    }

    // 8. ANA FONKSİYONLAR (Kart Oluşturma ve Modal)
    // ----------------------------------------------------

    /**
     * Gelen aday ID'sine göre modalı (popup) doldurur ve gösterir.
     * @param {string} candidateId - Tıklanan adayın ID'si (Timestamp kullanacağız)
     */
    function openModalById(candidateId) {
        // Tıklanan adayın tam verisini global diziden bul
        const candidate = allCandidatesData.find(c => c.timestamp === candidateId);
        if (!candidate) return; // Aday bulunamazsa dur

        // Verileri modal'a doldur
        // Google Apps Script'ten gelen (temizlenmiş) sütun adlarını kullanıyoruz
        modalImage.src = candidate.cvnimizlePaylas || 'icons/default-avatar.png'; // Resim sütunu (varsa)
        modalName.textContent = candidate.adSoyad;
        modalInterests.textContent = candidate.tecrubenOlanTeknolojiler;
        modalScore.textContent = candidate.aIGenelSkor;
        
        modalScore.className = 'score-badge'; // Önceki renkleri sıfırla
        modalScore.classList.add(getScoreClass(candidate.aIGenelSkor));
        
        // Google Sheet'ten e-posta ve telefon gelip gelmediğini kontrol et
        const email = candidate.email; // Sütun adını kendi sheet'inize göre ayarlayın
        const phone = candidate.phone; // Sütun adını kendi sheet'inize göre ayarlayın

        if (email) {
            modalEmail.href = `mailto:${email}`;
            modalEmail.style.display = 'block';
        } else {
            modalEmail.style.display = 'none';
        }

        if (phone) {
            modalPhone.href = `tel:${phone}`;
            modalPhone.style.display = 'block';
        } else {
            modalPhone.style.display = 'none';
        }
        
        // Modalı göster
        modalContainer.classList.add('show');
    }

    /**
     * Modalı gizler.
     */
    function closeModal() {
        modalContainer.classList.remove('show');
    }

    /**
     * Veri dizisini alır ve HTML kartlarını oluşturup listeye ekler.
     * @param {Array<object>} candidates - Aday nesnelerinden oluşan dizi
     */
    function displayCandidates(candidates) {
        candidateList.innerHTML = ''; // Listeyi temizle

        // Sadece AI değerlendirmesi tamamlanmış olanları filtrele
        const evaluatedCandidates = candidates.filter(c => c.aIDegerlendirmeDurumu === 'Değerlendirildi');

        if (evaluatedCandidates.length === 0) {
             candidateList.innerHTML = '<p class="loading-message">Değerlendirilmiş aday bulunamadı.</p>';
             return;
        }

        evaluatedCandidates.forEach(candidate => {
            const card = cardTemplate.content.cloneNode(true).children[0];

            const image = card.querySelector('.card-image');
            const name = card.querySelector('.card-name');
            const interests = card.querySelector('.card-interests');
            const scoreBadge = card.querySelector('.score-badge');
            const checkbox = card.querySelector('.candidate-select');

            // Google Apps Script'ten gelen (temizlenmiş) sütun adlarını kullanıyoruz
            image.src = candidate.cvnimizlePaylas || 'icons/default-avatar.png'; // Resim (varsa)
            name.textContent = candidate.adSoyad;
            interests.textContent = candidate.tecrubenOlanTeknolojiler;
            scoreBadge.textContent = candidate.aIGenelSkor;
            
            // ID olarak Google Sheet'teki benzersiz Timestamp'i (Zaman Damgası) kullanalım
            const candidateId = candidate.timestamp; 
            checkbox.value = candidateId;
            checkbox.checked = selectedCandidates.includes(candidateId);

            scoreBadge.classList.add(getScoreClass(candidate.aIGenelSkor));

            // Karta tıklandığında modalı aç (İstek 3)
            card.addEventListener('click', () => {
                openModalById(candidateId);
            });
            
            // Checkbox'a tıklandığında seçim mantığını çağırır
            checkbox.addEventListener('click', (event) => {
                event.stopPropagation(); // Modal'ın açılmasını engelle
                handleCandidateSelection(checkbox, candidateId);
            });

            candidateList.appendChild(card);
        });
    }

    // Modal'ı kapatma olaylarını ekle
    modalCloseBtn.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            closeModal();
        }
    });

    // 9. SAYFAYI BAŞLATMA
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

    /**
     * (GELECEK ADIM) n8n'e karşılaştırma isteği gönderir.
     */
    function handleCompareRequest() {
        if (selectedCandidates.length === 0) return;

        console.log("n8n'e gönderilecek aday ID'leri:", selectedCandidates);
        alert(`Şu adaylar karşılaştırma için n8n'e gönderiliyor (Konsola bakın):\n${selectedCandidates.join('\n')}`);
        
        // --- GELECEKTE BURAYA n8n "fetch" İSTEĞİ GELECEK ---
        // fetch('https://SENIN-N8N-WEBHOOK-URLN', {
        //     method: 'POST',
        //     body: JSON.stringify({ candidateIds: selectedCandidates })
        // })
        // .then(response => response.json())
        // .then(result => {
        //     alert("En iyi 3 aday: " + result.top3.join(', '));
        // })
        // .catch(error => console.error('n8n hatası:', error));
        // -------------------------------------------------
    }

    /**
     * Google Apps Script API'sinden aday verilerini çeker ve ekranı doldurur.
     */
    async function fetchCandidates() {
        candidateList.innerHTML = '<p class="loading-message">Adaylar yükleniyor...</p>';

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
            displayCandidates(allCandidatesData);

        } catch (error) {
            console.error('Veri çekme hatası:', error);
            candidateList.innerHTML = '<p class="error-message">Adaylar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        }
    }

    // Sahte veriler yerine artık bu fonksiyonu çağırıyoruz!
    fetchCandidates();

}); // DOMContentLoaded sonu