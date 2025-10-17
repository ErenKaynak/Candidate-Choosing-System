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

    // 1. Önce hafızada kayıtlı bir tercih var mı diye bakarız
    const savedTheme = localStorage.getItem('theme');
    
    // 2. Kayıt yoksa, kullanıcının sistem tercihine (tarayıcı/OS) bakarız
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let initialThemeIsDark = false;

    if (savedTheme) {
        // Kayıtlı tercih varsa onu kullan
        initialThemeIsDark = (savedTheme === 'dark');
    } else {
        // Kayıtlı tercih yoksa, sistem tercihini kullan
        initialThemeIsDark = prefersDark;
    }

    // Başlangıç temasını uygula
    setTheme(initialThemeIsDark);


    // 4. BUTON TIKLAMA OLAYINI EKLEME (Event Listener)
    // ----------------------------------------------------
    
    themeToggleBtn.addEventListener('click', () => {
        // O anki temanın tersini uygula
        const isCurrentlyDark = body.classList.contains('dark-mode');
        setTheme(!isCurrentlyDark); // "!" (değil) operatörü ile tersine çevir
    });
    
    
    // ----------------------------------------------------
    // YENİ KODLAR BURADAN BAŞLIYOR
    // ----------------------------------------------------

    // 5. SAHTE VERİ (MOCK DATA)
    // ----------------------------------------------------
    // Google Sheets'ten çekeceğimiz verinin bir benzeri.
    const mockCandidates = [
        {
            id: 'c1',
            name: 'Elif Kaya',
            interests: 'React, Node.js, Figma',
            imageUrl: 'https://via.placeholder.com/150/DD6E42/FFFFFF?text=EK',
            aiScore: 85,
            email: 'elif.kaya@example.com',
            phone: '555-123-4567'
        },
        {
            id: 'c2',
            name: 'Mehmet Öztürk',
            interests: 'Python, Django, Veri Bilimi',
            imageUrl: 'https://via.placeholder.com/150/4F6D7A/FFFFFF?text=MÖ',
            aiScore: 62,
            email: 'mehmet.ozturk@example.com',
            phone: '555-987-6543'
        },
        {
            id: 'c3',
            name: 'Zeynep Demir',
            interests: 'Flutter, Dart, Firebase',
            imageUrl: 'https://via.placeholder.com/150/6A8D73/FFFFFF?text=ZD',
            aiScore: 38,
            email: 'zeynep.demir@example.com',
            phone: '555-456-7890'
        }
    ];

    // 6. GEREKLİ DİĞER HTML ELEMENTLERİNİ SEÇME
    // ----------------------------------------------------
    const candidateList = document.getElementById('candidate-list');
    const cardTemplate = document.getElementById('candidate-card-template');

    // --> YENİ: Karşılaştırma butonu seçildi
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

    // --> YENİ: Seçilen adayları takip etmek için
    let selectedCandidates = [];
    const MAX_COMPARE_LIMIT = 10;

    // 7. YARDIMCI FONKSİYONLAR
    // ----------------------------------------------------
    
    /**
     * AI puanına göre CSS sınıfını döndürür (İstek 2)
     * @param {number} score - 0-100 arası AI Puanı
     */
    function getScoreClass(score) {
        if (score <= 49) return 'score-red';
        if (score <= 69) return 'score-yellow';
        return 'score-green';
    }

    // 8. ANA FONKSİYONLAR (Kart Oluşturma ve Modal)
    // ----------------------------------------------------

    /**
     * Gelen aday verisine göre modalı (popup) doldurur ve gösterir.
     * @param {object} candidate - Tek bir aday nesnesi
     */
    function openModal(candidate) {
        // Verileri modal'a doldur
        modalImage.src = candidate.imageUrl;
        modalName.textContent = candidate.name;
        modalInterests.textContent = candidate.interests;
        modalScore.textContent = candidate.aiScore;
        
        // Puan rengini ayarla
        modalScore.className = 'score-badge'; // Önceki renkleri sıfırla
        modalScore.classList.add(getScoreClass(candidate.aiScore));
        
        // İletişim bilgilerini (mailto ve tel linkleri) ayarla
        modalEmail.href = `mailto:${candidate.email}`;
        modalPhone.href = `tel:${candidate.phone}`;

        // Telefon veya e-posta yoksa gizle (opsiyonel)
        modalEmail.style.display = candidate.email ? 'block' : 'none';
        modalPhone.style.display = candidate.phone ? 'block' : 'none';
        
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
        // Yeni kartları eklemeden önce listeyi temizle
        candidateList.innerHTML = ''; 

        candidates.forEach(candidate => {
            // 1. HTML şablonunu (template) kopyala
            const card = cardTemplate.content.cloneNode(true).children[0];

            // 2. Şablon içindeki elementleri seç
            const image = card.querySelector('.card-image');
            const name = card.querySelector('.card-name');
            const interests = card.querySelector('.card-interests');
            const scoreBadge = card.querySelector('.score-badge');
            const checkbox = card.querySelector('.candidate-select');

            // 3. Verileri elementlere doldur
            image.src = candidate.imageUrl;
            name.textContent = candidate.name;
            interests.textContent = candidate.interests;
            scoreBadge.textContent = candidate.aiScore;
            
            // Veriyle checkbox'ın değerini ayarla (Karşılaştırma için)
            checkbox.value = candidate.id;

            // --> GÜNCELLENDİ: Sayfa yüklendiğinde seçili olanları işaretler
            checkbox.checked = selectedCandidates.includes(candidate.id);

            // 4. AI Puanına göre renk sınıfını ekle (İstek 2)
            scoreBadge.classList.add(getScoreClass(candidate.aiScore));

            // 5. Olay Dinleyicilerini Ekle
            
            // Karta tıklandığında modalı aç (İstek 3)
            card.addEventListener('click', () => {
                openModal(candidate);
            });
            
            // --> GÜNCELLENDİ: Checkbox'a tıklandığında seçim mantığını çağırır
            checkbox.addEventListener('click', (event) => {
                event.stopPropagation(); 
                handleCandidateSelection(checkbox, candidate.id);
            });

            // 6. Hazırlanan kartı listeye ekle
            candidateList.appendChild(card);
        });
    }

    // Modal'ı kapatma olaylarını ekle
    modalCloseBtn.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (event) => {
        // Eğer tıklanan yer modal'ın dışı (gri arka plan) ise kapat
        if (event.target === modalContainer) {
            closeModal();
        }
    });

    // 9. SAYFAYI BAŞLATMA
    // ----------------------------------------------------
    
    // --> GÜNCELLENDİ: updateCompareButton fonksiyonu artık dolu
    /**
     * Checkbox tıklandığında seçilen aday listesini günceller.
     * @param {HTMLInputElement} checkbox - Tıklanan checkbox
     * @param {string} candidateId - Adayın ID'si
     */
    function handleCandidateSelection(checkbox, candidateId) {
        if (checkbox.checked) {
            // Adayı ekle
            if (selectedCandidates.length < MAX_COMPARE_LIMIT) {
                selectedCandidates.push(candidateId);
            } else {
                // Limite ulaşıldı, seçime izin verme
                checkbox.checked = false;
                alert(`Karşılaştırma için en fazla ${MAX_COMPARE_LIMIT} aday seçebilirsiniz.`);
            }
        } else {
            // Adayı çıkar
            selectedCandidates = selectedCandidates.filter(id => id !== candidateId);
        }
        
        // Butonu güncelle
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
    
    // --> YENİ: Karşılaştır butonuna tıklama olayı
    compareButton.addEventListener('click', () => {
        // Bu fonksiyon n8n'e veriyi gönderecek
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
    // --------------------
    
    // Sahte verilerimizi kullanarak kartları ekrana çizdir!
    displayCandidates(mockCandidates);

}); // DOMContentLoaded sonu