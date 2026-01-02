const express = require('express');
const router = express.Router();
const LegalPage = require('../models/LegalPage');
const { authMiddleware } = require('../middleware/auth');

// Varsayılan içerikler - App Store ve Google Play uyumlu
const defaultContent = {
  privacy: {
    title: 'Gizlilik Politikası',
    content: `
<h2>1. Giriş</h2>
<p>Nomanoğlu Kuyumculuk ("Şirket", "biz", "bizim") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizin güvenliğine büyük önem veriyoruz. Bu Gizlilik Politikası, "Nomanoğlu Altın" mobil uygulaması ("Uygulama") ve web sitemiz aracılığıyla toplanan, kullanılan ve korunan bilgileri açıklamaktadır.</p>
<p><strong>Son Güncelleme:</strong> Bu politika en son 02 Ocak 2026 tarihinde güncellenmiştir.</p>

<h2>2. Veri Sorumlusu</h2>
<p>Kişisel verilerinizin işlenmesinden sorumlu veri sorumlusu:</p>
<p><strong>Nomanoğlu Kuyumculuk</strong><br>
E-posta: info@nomanoglu.com<br>
Telefon: +90 532 290 46 01</p>

<h2>3. Toplanan Veriler</h2>
<p>Uygulamamız <strong>minimum veri toplama</strong> ilkesiyle çalışır. Toplanan veriler:</p>

<h3>3.1 Cihazda Yerel Olarak Saklanan Veriler</h3>
<ul>
<li><strong>Favori Ürünler:</strong> Favori olarak işaretlediğiniz altın/döviz ürünleri</li>
<li><strong>Fiyat Alarmları:</strong> Oluşturduğunuz fiyat alarm ayarları</li>
<li><strong>Uygulama Tercihleri:</strong> Bildirim izinleri ve onboarding durumu</li>
</ul>
<p><em>Bu veriler yalnızca cihazınızda (AsyncStorage) saklanır ve sunucularımıza gönderilmez.</em></p>

<h3>3.2 Sunucularımızdan Çekilen Veriler</h3>
<ul>
<li><strong>Fiyat Verileri:</strong> Anlık altın ve döviz fiyatları (genel veri, kişisel değil)</li>
<li><strong>Şube Bilgileri:</strong> Mağaza adresleri ve iletişim bilgileri (genel veri)</li>
</ul>

<h3>3.3 Toplanmayan Veriler</h3>
<p>Uygulamamız aşağıdaki verileri <strong>toplamaz</strong>:</p>
<ul>
<li>Konum bilgisi (GPS)</li>
<li>Kişi listesi veya rehber</li>
<li>Fotoğraf veya medya dosyaları</li>
<li>Hesap/kimlik bilgileri (uygulama giriş gerektirmez)</li>
<li>Finansal veya ödeme bilgileri</li>
<li>Sağlık verileri</li>
</ul>

<h2>4. Verilerin Kullanım Amacı</h2>
<p>Yerel olarak saklanan veriler şu amaçlarla kullanılır:</p>
<ul>
<li>Favori ürünlerinizi hızlıca görüntülemenizi sağlamak</li>
<li>Belirlediğiniz fiyat hedeflerine ulaşıldığında bildirim göndermek</li>
<li>Uygulama deneyiminizi kişiselleştirmek</li>
</ul>

<h2>5. Bildirimler (Push Notifications)</h2>
<p>Uygulamamız fiyat alarmları için bildirim gönderebilir:</p>
<ul>
<li>Bildirimler yalnızca izin vermeniz halinde gönderilir</li>
<li>Bildirim izinlerini istediğiniz zaman cihaz ayarlarından kapatabilirsiniz</li>
<li>Bildirimler için Expo Push Notification servisi kullanılmaktadır</li>
</ul>

<h2>6. Üçüncü Taraf Hizmetler</h2>
<p>Uygulamamız aşağıdaki üçüncü taraf hizmetleri kullanır:</p>
<ul>
<li><strong>Expo:</strong> Uygulama altyapısı ve push bildirimleri (<a href="https://expo.dev/privacy" target="_blank">Expo Gizlilik Politikası</a>)</li>
</ul>
<p>Bu hizmetler kendi gizlilik politikalarına tabidir.</p>

<h2>7. Veri Güvenliği</h2>
<p>Verilerinizin güvenliği için aldığımız önlemler:</p>
<ul>
<li>Kişisel tercihleriniz cihazınızda şifreli olarak saklanır</li>
<li>Sunucu iletişimi HTTPS/TLS ile şifrelenir</li>
<li>Sunucularımıza kişisel veri aktarımı yapılmaz</li>
</ul>

<h2>8. Veri Saklama Süresi</h2>
<ul>
<li><strong>Cihaz Verileri:</strong> Uygulamayı silene kadar cihazınızda kalır</li>
<li><strong>Uygulama Silindiğinde:</strong> Tüm yerel veriler otomatik olarak silinir</li>
</ul>

<h2>9. Kullanıcı Hakları (KVKK Madde 11)</h2>
<p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
<ul>
<li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
<li>İşlenmişse buna ilişkin bilgi talep etme</li>
<li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
<li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
<li>Verilerin silinmesini veya yok edilmesini isteme</li>
</ul>
<p>Bu haklarınızı kullanmak için: <strong>info@nomanoglu.com</strong></p>

<h2>10. Çocukların Gizliliği</h2>
<p>Uygulamamız 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaş altı kullanıcılardan kişisel bilgi toplamıyoruz. Ebeveynler veya veliler, çocuklarının bilgi paylaştığını düşünüyorlarsa bizimle iletişime geçebilirler.</p>

<h2>11. Uluslararası Veri Transferi</h2>
<p>Kişisel verileriniz Türkiye dışına aktarılmaz. Fiyat verileri Türkiye'deki sunucularımızdan sağlanmaktadır.</p>

<h2>12. Politika Değişiklikleri</h2>
<p>Bu gizlilik politikası güncellenebilir. Önemli değişikliklerde uygulama içi bildirim yapılacaktır. Güncel politikayı düzenli olarak kontrol etmenizi öneririz.</p>

<h2>13. İletişim</h2>
<p>Gizlilik politikamız hakkında sorularınız için:</p>
<p><strong>E-posta:</strong> info@nomanoglu.com<br>
<strong>Telefon:</strong> +90 532 290 46 01<br>
<strong>Adres:</strong> Nomanoğlu Kuyumculuk, Türkiye</p>
    `,
    lastUpdated: '02.01.2026'
  },
  terms: {
    title: 'Kullanım Koşulları',
    content: `
<h2>1. Sözleşmenin Konusu ve Kabul</h2>
<p>Bu Kullanım Koşulları ("Sözleşme"), Nomanoğlu Kuyumculuk ("Şirket") tarafından sunulan "Nomanoğlu Altın" mobil uygulaması ("Uygulama") ve ilgili hizmetlerin kullanımını düzenler.</p>
<p>Uygulamayı indirerek, yükleyerek veya kullanarak bu koşulları kabul etmiş sayılırsınız. Bu koşulları kabul etmiyorsanız, lütfen uygulamayı kullanmayınız.</p>

<h2>2. Hizmet Tanımı</h2>
<p>Uygulama aşağıdaki hizmetleri sunar:</p>
<ul>
<li>Anlık altın fiyatları takibi</li>
<li>Anlık döviz kurları takibi</li>
<li>Fiyat alarm sistemi</li>
<li>Favori ürün listesi oluşturma</li>
<li>Şube ve iletişim bilgileri</li>
</ul>
<p><strong>Önemli:</strong> Uygulama üzerinden herhangi bir alım-satım işlemi gerçekleştirilememektedir. Uygulama yalnızca bilgilendirme amaçlıdır.</p>

<h2>3. Yatırım Tavsiyesi Değildir - Sorumluluk Reddi</h2>
<p style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
<strong>⚠️ ÖNEMLİ UYARI:</strong><br><br>
Bu uygulamada gösterilen fiyatlar, grafikler ve bilgiler <strong>YALNIZCA BİLGİLENDİRME AMAÇLIDIR</strong> ve hiçbir şekilde:<br><br>
• Yatırım tavsiyesi<br>
• Alım-satım önerisi<br>
• Finansal danışmanlık<br>
• Getiri garantisi<br><br>
olarak değerlendirilmemelidir.<br><br>
Yatırım kararlarınızı vermeden önce <strong>mutlaka lisanslı bir yatırım danışmanına</strong> başvurunuz.
</p>

<h2>4. Fiyat Bilgilerinin Niteliği</h2>
<p>Uygulamada gösterilen fiyatlar hakkında:</p>
<ul>
<li>Fiyatlar <strong>gösterge niteliğindedir</strong> ve anlık olarak güncellenir</li>
<li>Gerçek işlem fiyatları uygulama fiyatlarından <strong>farklılık gösterebilir</strong></li>
<li>Teknik aksaklıklar nedeniyle fiyat güncellemeleri gecikebilir</li>
<li>Fiyatların doğruluğu <strong>garanti edilmez</strong></li>
<li>İşlem yapmadan önce <strong>şubelerimizle iletişime geçmeniz</strong> önerilir</li>
</ul>

<h2>5. Sorumluluk Sınırları</h2>
<p>Nomanoğlu Kuyumculuk:</p>
<ul>
<li>Fiyat bilgilerinin doğruluğunu veya güncelliğini garanti etmez</li>
<li>Teknik arızalar, kesintiler veya gecikmelerden sorumlu değildir</li>
<li>Uygulamadaki bilgilere dayanarak yapılan yatırım kararlarından sorumlu değildir</li>
<li>Üçüncü taraf kaynaklı veri hatalarından sorumlu değildir</li>
<li>Dolaylı, özel veya sonuç olarak ortaya çıkan zararlardan sorumlu değildir</li>
<li>İnternet bağlantısı sorunlarından kaynaklanan aksaklıklardan sorumlu değildir</li>
</ul>

<h2>6. Kullanıcı Yükümlülükleri</h2>
<p>Uygulama kullanıcısı olarak:</p>
<ul>
<li>Uygulamayı yalnızca yasal amaçlarla kullanacağınızı</li>
<li>Uygulamayı kötüye kullanmayacağınızı (hack, reverse engineering vb.)</li>
<li>Uygulama üzerinden yanıltıcı bilgi yaymayacağınızı</li>
<li>Yatırım kararlarınızdan kendinizin sorumlu olduğunuzu</li>
</ul>
<p>kabul ve taahhüt edersiniz.</p>

<h2>7. Fikri Mülkiyet Hakları</h2>
<p>Uygulamadaki tüm içerik, tasarım, logo, grafik, yazılım ve diğer materyaller Nomanoğlu Kuyumculuk'un mülkiyetindedir ve telif hakkı yasaları ile korunmaktadır.</p>
<p>İzinsiz kopyalama, dağıtma, değiştirme veya ticari kullanım yasaktır.</p>

<h2>8. Hesap ve Giriş</h2>
<p>Uygulamamız:</p>
<ul>
<li>Kullanıcı hesabı oluşturmayı <strong>gerektirmez</strong></li>
<li>Kişisel bilgi girişi <strong>istemez</strong></li>
<li>Tüm tercihler cihazınızda yerel olarak saklanır</li>
</ul>

<h2>9. Bildirimler</h2>
<p>Fiyat alarmı bildirimleri:</p>
<ul>
<li>Yalnızca sizin izninizle gönderilir</li>
<li>Cihaz ayarlarından kapatılabilir</li>
<li>Alarm koşulları gerçekleştiğinde tetiklenir</li>
</ul>

<h2>10. Hizmet Değişiklikleri</h2>
<p>Nomanoğlu Kuyumculuk:</p>
<ul>
<li>Uygulamayı istediği zaman güncelleyebilir</li>
<li>Özellikleri ekleyebilir veya kaldırabilir</li>
<li>Hizmeti geçici veya kalıcı olarak durdurabilir</li>
</ul>
<p>Önemli değişikliklerde kullanıcılar bilgilendirilecektir.</p>

<h2>11. Sözleşme Değişiklikleri</h2>
<p>Bu kullanım koşulları önceden haber vermeksizin değiştirilebilir. Değişiklikler uygulamada yayınlandığı tarihte yürürlüğe girer. Uygulamayı kullanmaya devam etmeniz, değişiklikleri kabul ettiğiniz anlamına gelir.</p>

<h2>12. Fesih</h2>
<p>Bu sözleşme:</p>
<ul>
<li>Uygulamayı cihazınızdan sildiğinizde sona erer</li>
<li>Koşulların ihlali halinde Şirket tarafından tek taraflı feshedilebilir</li>
</ul>

<h2>13. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h2>
<p>Bu sözleşme <strong>Türkiye Cumhuriyeti kanunlarına</strong> tabidir. Uyuşmazlık halinde <strong>İstanbul Mahkemeleri ve İcra Daireleri</strong> yetkilidir.</p>

<h2>14. Bölünebilirlik</h2>
<p>Bu sözleşmenin herhangi bir hükmünün geçersiz veya uygulanamaz olması, diğer hükümlerin geçerliliğini etkilemez.</p>

<h2>15. İletişim</h2>
<p>Kullanım koşulları hakkında sorularınız için:</p>
<p><strong>E-posta:</strong> info@nomanoglu.com<br>
<strong>Telefon:</strong> +90 532 290 46 01<br>
<strong>Web:</strong> www.nomanoglu.com.tr</p>

<p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
<em>Bu kullanım koşulları 02 Ocak 2026 tarihinde güncellenmiştir.</em>
</p>
    `,
    lastUpdated: '02.01.2026'
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
