const express = require('express');
const router = express.Router();
const LegalPage = require('../models/LegalPage');
const { authMiddleware } = require('../middleware/auth');

// Varsayılan içerikler
const defaultContent = {
  privacy: {
    title: 'Gizlilik Politikası',
    content: `
<h2>1. Giriş</h2>
<p>Nomanoğlu Kuyumculuk olarak kişisel verilerinizin güvenliği konusunda büyük özen gösteriyoruz. Bu gizlilik politikası, mobil uygulamamız ve web sitemiz aracılığıyla topladığımız bilgilerin nasıl kullanıldığını açıklamaktadır.</p>

<h2>2. Toplanan Bilgiler</h2>
<p>Uygulamamızı kullanırken aşağıdaki bilgiler toplanabilir:</p>
<ul>
<li><strong>Favori Ürünler:</strong> Uygulamada favori olarak işaretlediğiniz ürünler cihazınızda yerel olarak saklanır.</li>
<li><strong>Fiyat Alarmları:</strong> Oluşturduğunuz fiyat alarmları cihazınızda yerel olarak saklanır.</li>
<li><strong>Bildirim Tercihleri:</strong> Bildirim izinleriniz ve tercihleriniz.</li>
</ul>

<h2>3. Bilgilerin Kullanımı</h2>
<p>Toplanan bilgiler aşağıdaki amaçlarla kullanılır:</p>
<ul>
<li>Kişiselleştirilmiş fiyat takibi sağlamak</li>
<li>Fiyat alarmı bildirimleri göndermek</li>
<li>Uygulama deneyimini iyileştirmek</li>
</ul>

<h2>4. Veri Güvenliği</h2>
<p>Verileriniz cihazınızda yerel olarak saklanır ve sunucularımıza gönderilmez. Fiyat bilgileri anlık olarak sunucularımızdan çekilir ancak kişisel tercihleriniz cihazınızda kalır.</p>

<h2>5. Üçüncü Taraf Hizmetler</h2>
<p>Uygulamamız aşağıdaki üçüncü taraf hizmetleri kullanabilir:</p>
<ul>
<li>Expo Push Notifications (bildirimler için)</li>
</ul>

<h2>6. Çocukların Gizliliği</h2>
<p>Uygulamamız 13 yaşın altındaki çocuklara yönelik değildir ve bilerek bu yaş grubundan kişisel bilgi toplamıyoruz.</p>

<h2>7. Değişiklikler</h2>
<p>Bu gizlilik politikası zaman zaman güncellenebilir. Değişiklikler bu sayfada yayınlanacaktır.</p>

<h2>8. İletişim</h2>
<p>Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz.</p>
    `,
    lastUpdated: new Date().toLocaleDateString('tr-TR')
  },
  terms: {
    title: 'Kullanım Koşulları',
    content: `
<h2>1. Kabul</h2>
<p>Nomanoğlu Kuyumculuk mobil uygulamasını ("Uygulama") kullanarak bu kullanım koşullarını kabul etmiş sayılırsınız.</p>

<h2>2. Hizmet Tanımı</h2>
<p>Uygulama, anlık altın ve döviz fiyatlarını takip etmenizi sağlayan bir bilgi hizmetidir. Uygulama üzerinden alım satım işlemi yapılamamaktadır.</p>

<h2>3. Yatırım Tavsiyesi Değildir</h2>
<p><strong>ÖNEMLİ:</strong> Bu uygulamada gösterilen fiyatlar yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımaz. Yatırım kararlarınızı vermeden önce profesyonel danışmanlık almanızı öneririz.</p>

<h2>4. Fiyat Bilgileri</h2>
<p>Gösterilen fiyatlar anlık olarak güncellenmektedir. Ancak:</p>
<ul>
<li>Fiyatlar gösterge niteliğindedir</li>
<li>Gerçek işlem fiyatları farklılık gösterebilir</li>
<li>İşlem yapmadan önce şubelerimizle iletişime geçmenizi öneririz</li>
</ul>

<h2>5. Sorumluluk Reddi</h2>
<p>Nomanoğlu Kuyumculuk:</p>
<ul>
<li>Fiyat bilgilerinin doğruluğunu garanti etmez</li>
<li>Teknik aksaklıklardan kaynaklanan kesintilerden sorumlu değildir</li>
<li>Kullanıcıların yatırım kararlarından sorumlu değildir</li>
</ul>

<h2>6. Fikri Mülkiyet</h2>
<p>Uygulamadaki tüm içerik, tasarım ve logolar Nomanoğlu Kuyumculuk'a aittir ve telif hakkı ile korunmaktadır.</p>

<h2>7. Hesap Güvenliği</h2>
<p>Uygulama hesap oluşturmayı gerektirmez. Tüm tercihleriniz cihazınızda yerel olarak saklanır.</p>

<h2>8. Değişiklikler</h2>
<p>Bu kullanım koşulları önceden haber vermeksizin değiştirilebilir. Güncel koşulları düzenli olarak kontrol etmenizi öneririz.</p>

<h2>9. Uygulanacak Hukuk</h2>
<p>Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir.</p>

<h2>10. İletişim</h2>
<p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
    `,
    lastUpdated: new Date().toLocaleDateString('tr-TR')
  }
};

// Tüm legal sayfaları getir
router.get('/', async (req, res) => {
  try {
    let pages = await LegalPage.find({ isActive: true });

    // Eğer sayfalar yoksa varsayılanları oluştur
    if (pages.length === 0) {
      const privacyPage = new LegalPage({
        type: 'privacy',
        ...defaultContent.privacy
      });
      const termsPage = new LegalPage({
        type: 'terms',
        ...defaultContent.terms
      });

      await privacyPage.save();
      await termsPage.save();

      pages = [privacyPage, termsPage];
      console.log('✅ Varsayılan legal sayfalar oluşturuldu');
    }

    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Legal sayfalar getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Belirli bir legal sayfayı getir (type: privacy veya terms)
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;

    if (!['privacy', 'terms'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sayfa tipi. privacy veya terms olmalı.'
      });
    }

    let page = await LegalPage.findOne({ type, isActive: true });

    // Eğer sayfa yoksa varsayılanı oluştur
    if (!page) {
      page = new LegalPage({
        type,
        ...defaultContent[type]
      });
      await page.save();
      console.log(`✅ Varsayılan ${type} sayfası oluşturuldu`);
    }

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Legal sayfa getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Legal sayfa güncelle - Admin korumalı
router.put('/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { title, content, lastUpdated, isActive } = req.body;

    if (!['privacy', 'terms'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sayfa tipi. privacy veya terms olmalı.'
      });
    }

    let page = await LegalPage.findOne({ type });

    if (!page) {
      page = new LegalPage({ type });
    }

    if (title !== undefined) page.title = title;
    if (content !== undefined) page.content = content;
    if (lastUpdated !== undefined) page.lastUpdated = lastUpdated;
    if (isActive !== undefined) page.isActive = isActive;

    await page.save();
    console.log(`✅ ${type} sayfası güncellendi`);

    res.json({
      success: true,
      data: page,
      message: 'Sayfa başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Legal sayfa güncelleme hatası:', error);
    res.status(400).json({
      success: false,
      message: 'Güncelleme başarısız',
      error: error.message
    });
  }
});

module.exports = router;
