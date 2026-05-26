import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { useWebSocket } from '../../hooks/useWebSocket';
import { TrendingUp, LogOut, Plus, Edit2, Trash2, X, Save, AlertCircle, RefreshCw, Settings, FileText, Users, GripVertical, Building2, MapPin, Phone, Mail, Clock, ExternalLink, Search, ClipboardList, Download, Eye, EyeOff, Calendar, Filter, Menu, UserCog, ShieldCheck, PanelLeft, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { getAuth, hasPermission, ADMIN_SECTIONS } from '../../lib/auth';

// Auth header ile axios instance oluştur
const createAuthAxios = () => {
  const instance = axios.create();
  instance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
};

export default function AdminDashboard() {
  const authAxios = useMemo(() => createAuthAxios(), []);
  const router = useRouter();
  const { prices: websocketPrices, isConnected, lastUpdate: wsLastUpdate } = useWebSocket();
  const [sourcePrices, setSourcePrices] = useState([]);
  const [customPrices, setCustomPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [filter, setFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');
  const [maxDisplayItems, setMaxDisplayItems] = useState(20);
  const [logoBase64, setLogoBase64] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoHeight, setLogoHeight] = useState(48); // px
  const [logoWidth, setLogoWidth] = useState('auto'); // 'auto' veya px değeri
  const [faviconBase64, setFaviconBase64] = useState('');
  const [priceTableImage, setPriceTableImage] = useState('');

  // İletişim Bilgileri state
  const [contactPhone, setContactPhone] = useState('+90 (XXX) XXX XX XX');
  const [contactEmail, setContactEmail] = useState('info@nomanoglu.com');
  const [contactAddress, setContactAddress] = useState('Istanbul, Turkiye');
  const [workingHours, setWorkingHours] = useState('Pzt - Cmt: 09:00 - 19:00');
  const [workingHoursNote, setWorkingHoursNote] = useState('Pazar: Kapali');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('905322904601');
  const [employeePassword, setEmployeePassword] = useState('');
  const [businessPassword, setBusinessPassword] = useState('');
  const [hasEmployeePassword, setHasEmployeePassword] = useState(false);
  const [hasBusinessPassword, setHasBusinessPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [showBusinessPassword, setShowBusinessPassword] = useState(false);

  // İşletme Fiyatları state
  const [businessPrices, setBusinessPrices] = useState([]);
  const [businessEdits, setBusinessEdits] = useState({});
  const [businessSavingCode, setBusinessSavingCode] = useState(null);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txBranchFilter, setTxBranchFilter] = useState('all');
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [showTxEditModal, setShowTxEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txFormData, setTxFormData] = useState({
    fullName: '', identityNumber: '', phone: '', occupation: '',
    address: '', date: '', branchId: '', totalAmount: '',
    details: '', additionalInfo: '', status: 'pending'
  });

  // Tab state
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'family' | 'articles' | 'branches' | 'transactions' | 'settings'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Oturum & yetki
  const [auth, setAuth] = useState(null);
  const can = (section) => hasPermission(auth, section);

  // Sekme tanımları (hem masaüstü nav hem mobil menü bunu kullanır)
  const adminTabs = [
    { id: 'prices',         label: 'Fiyat Yönetimi',    icon: TrendingUp },
    { id: 'businessPrices', label: 'İşletme Fiyatları',  icon: Building2 },
    { id: 'family',         label: 'NOMANOĞLU Ailesi',  icon: Users },
    { id: 'articles',       label: 'Rehber Makaleleri', icon: FileText },
    { id: 'branches',       label: 'Şubeler',           icon: Building2 },
    { id: 'transactions',   label: 'İşlemler',          icon: ClipboardList },
    { id: 'settings',       label: 'Ayarlar',           icon: Settings },
    { id: 'users',          label: 'Kullanıcılar',      icon: UserCog, adminOnly: true },
  ];
  // Yalnızca yetkili olunan sekmeler (admin hepsini, kullanıcı yönetimi yalnızca admin)
  const visibleTabs = adminTabs.filter((t) => (t.adminOnly ? (auth && auth.isAdmin) : can(t.id)));

  // Drag & Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);

  // Family Cards state
  const [familyCards, setFamilyCards] = useState([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [familyFormData, setFamilyFormData] = useState({
    label: '',
    title: '',
    description: '',
    icon: 'TrendingUp',
    order: 1
  });

  // Articles state
  const [articles, setArticles] = useState([]);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleFormData, setArticleFormData] = useState({
    category: 'Yatırım',
    title: '',
    description: '',
    content: '',
    icon: 'Coins',
    order: 1
  });

  // Branches state
  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    workingHours: '09:00 - 18:00',
    mapLink: '',
    companyTitle: '',
    taxOffice: '',
    taxNumber: '',
    tradeRegistryNo: ''
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'doviz',
    decimals: 0,
    alisConfig: {
      sourceCode: '',
      sourceType: 'satis',
      multiplier: 1,
      addition: 0
    },
    satisConfig: {
      sourceCode: '',
      sourceType: 'satis',
      multiplier: 1,
      addition: 0
    },
    // Yedek kaynak yapılandırması
    backupAlisConfig: {
      sourceCode: '',
      sourceType: 'satis',
      multiplier: 1,
      addition: 0
    },
    backupSatisConfig: {
      sourceCode: '',
      sourceType: 'satis',
      multiplier: 1,
      addition: 0
    },
    activeSource: 'primary',
    manualSourceOverride: false
  });

  // Yedek kaynak fiyatları
  const [backupSourcePrices, setBackupSourcePrices] = useState([]);
  const [apiStatus, setApiStatus] = useState(null);

  // Toplu güncelleme state
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkTarget, setBulkTarget] = useState('primary'); // 'primary' | 'backup' | 'all'
  const [bulkAdditions, setBulkAdditions] = useState({}); // { [priceId]: { alis: number, satis: number } }
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    const a = getAuth();
    if (!a) {
      router.push('/admin/login');
      return;
    }
    setAuth(a);
    loadData(a);
  }, []);

  // Aktif sekme izinli değilse ilk izinli sekmeye geç
  useEffect(() => {
    if (!auth) return;
    const allowed = adminTabs
      .filter((t) => (t.adminOnly ? auth.isAdmin : hasPermission(auth, t.id)))
      .map((t) => t.id);
    if (allowed.length && !allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  }, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  // İlk açılışta MongoDB'den kaynak fiyatları yükle
  const loadSourcePricesFromDB = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/prices/sources`);
      if (response.data.success && response.data.data.length > 0) {
        setSourcePrices(response.data.data);
        setLastUpdate(response.data.lastUpdate);
        console.log(`✅ ${response.data.data.length} kaynak fiyat DB'den yüklendi`);
      }
    } catch (error) {
      console.error('Kaynak fiyat yükleme hatası:', error);
    }
  };

  // Yedek kaynak fiyatlarını yükle
  const loadBackupSourcePrices = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/prices/backup-sources`);
      if (response.data.success && response.data.data.length > 0) {
        setBackupSourcePrices(response.data.data);
        console.log(`✅ ${response.data.data.length} yedek kaynak fiyat yüklendi`);
      }
    } catch (error) {
      console.error('Yedek kaynak fiyat yükleme hatası:', error);
    }
  };

  // API durumunu yükle
  const loadApiStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/prices/api-status`);
      if (response.data.success) {
        setApiStatus(response.data.data);
      }
    } catch (error) {
      console.error('API durum yükleme hatası:', error);
    }
  };

  // İlk yüklemede MongoDB'den al
  useEffect(() => {
    loadSourcePricesFromDB();
    loadBackupSourcePrices();
    loadApiStatus();
    // API durumunu periyodik güncelle
    const interval = setInterval(loadApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket'ten gelen fiyatlarla mevcut state'i güncelle (üzerine yaz)
  useEffect(() => {
    if (websocketPrices && websocketPrices.length > 0) {
      // Sadece ham API fiyatlarını al (isCustom: false)
      const rawPrices = websocketPrices.filter(p => p.isCustom === false);

      if (rawPrices.length > 0) {
        // Mevcut fiyatları koru, sadece gelen fiyatları üzerine yaz
        setSourcePrices(prevPrices => {
          // Mevcut fiyatları map'e çevir
          const priceMap = {};
          prevPrices.forEach(p => {
            priceMap[p.code] = p;
          });

          // Gelen yeni fiyatları üzerine yaz
          rawPrices.forEach(price => {
            priceMap[price.code] = {
              code: price.code,
              name: price.name,
              rawAlis: price.rawAlis || 0,
              rawSatis: price.rawSatis || 0
            };
          });

          // Map'i array'e çevir
          return Object.values(priceMap);
        });
        setLastUpdate(new Date().toISOString());
      }
    }
  }, [websocketPrices]);

  // Son güncellemeden bu yana geçen süreyi hesapla
  useEffect(() => {
    const updateTimeSince = () => {
      if (!lastUpdate) {
        setTimeSinceUpdate('Bekleniyor...');
        return;
      }

      const now = new Date();
      const updateTime = new Date(lastUpdate);
      const diffMs = now - updateTime;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffSec < 5) {
        setTimeSinceUpdate('Şimdi');
      } else if (diffSec < 60) {
        setTimeSinceUpdate(`${diffSec} saniye önce`);
      } else if (diffMin < 60) {
        setTimeSinceUpdate(`${diffMin} dakika önce`);
      } else {
        setTimeSinceUpdate(`${diffHour} saat önce`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const loadData = async (authArg) => {
    const a = authArg || auth;
    const allowed = (s) => Boolean(a && (a.isAdmin || (a.permissions || []).includes(s)));
    console.log('🔄 Admin Panel - Veri yükleniyor...');

    // --- Herkese açık veriler (logo/iletişim ve liste verileri) ---
    try {
      const sRes = await axios.get(`${apiUrl}/api/settings`);
      if (sRes.data.success) {
        const s = sRes.data.data;
        setMaxDisplayItems(s.maxDisplayItems || 20);
        setLogoBase64(s.logoBase64 || '');
        setLogoHeight(s.logoHeight || 48);
        setLogoWidth(s.logoWidth || 'auto');
        setFaviconBase64(s.faviconBase64 || '');
        setPriceTableImage(s.priceTableImage || '');
        setContactPhone(s.contactPhone || '+90 (XXX) XXX XX XX');
        setContactEmail(s.contactEmail || 'info@nomanoglu.com');
        setContactAddress(s.contactAddress || 'Istanbul, Turkiye');
        setWorkingHours(s.workingHours || 'Pzt - Cmt: 09:00 - 19:00');
        setWorkingHoursNote(s.workingHoursNote || 'Pazar: Kapali');
        setSocialFacebook(s.socialFacebook || '');
        setSocialTwitter(s.socialTwitter || '');
        setSocialInstagram(s.socialInstagram || '');
        setSocialYoutube(s.socialYoutube || '');
        setSocialTiktok(s.socialTiktok || '');
        setSocialWhatsapp(s.socialWhatsapp || '905322904601');
      }
    } catch (e) { console.error('Ayarlar (public) yüklenemedi:', e.message); }

    try {
      const r = await axios.get(`${apiUrl}/api/custom-prices`);
      if (r.data.success) setCustomPrices(r.data.data);
    } catch (e) { console.error('Custom fiyat yüklenemedi:', e.message); }

    try {
      const r = await axios.get(`${apiUrl}/api/family-cards`);
      if (r.data.success) setFamilyCards(r.data.data);
    } catch (e) { console.error('Family kart yüklenemedi:', e.message); }

    try {
      const r = await axios.get(`${apiUrl}/api/articles`);
      if (r.data.success) setArticles(r.data.data);
    } catch (e) { console.error('Makale yüklenemedi:', e.message); }

    // --- Yetki gerektiren veriler ---
    if (allowed('settings')) {
      try {
        const r = await authAxios.get(`${apiUrl}/api/settings/admin`);
        if (r.data.success) {
          setHasEmployeePassword(Boolean(r.data.data.employeePassword));
          setHasBusinessPassword(Boolean(r.data.data.businessPassword));
          setEmployeePassword('');
          setBusinessPassword('');
        }
      } catch (e) { console.error('Admin ayarları yüklenemedi:', e.message); }
    }

    if (allowed('branches')) {
      try {
        const r = await authAxios.get(`${apiUrl}/api/branches/admin/all`);
        if (r.data.success) setBranches(r.data.data);
      } catch (e) { console.error('Şubeler yüklenemedi:', e.message); }
    }

    if (a && a.isAdmin) {
      try {
        const r = await authAxios.get(`${apiUrl}/api/users`);
        if (r.data.success) setUsers(r.data.data);
      } catch (e) { console.error('Kullanıcılar yüklenemedi:', e.message); }
    }

    console.log('✅ Veriler yüklendi (yetkiye göre)');
    setLoading(false);
  };

  // Kullanıcı (staff) yönetimi
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ username: '', password: '', name: '', permissions: [], isActive: true });
  const [userSaving, setUserSaving] = useState(false);

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserFormData({ username: '', password: '', name: '', permissions: [], isActive: true });
    setShowUserModal(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setUserFormData({ username: u.username, password: '', name: u.name || '', permissions: u.permissions || [], isActive: u.isActive !== false });
    setShowUserModal(true);
  };

  const toggleUserPermission = (sectionId) => {
    setUserFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(sectionId)
        ? prev.permissions.filter((p) => p !== sectionId)
        : [...prev.permissions, sectionId],
    }));
  };

  const handleSaveUser = async () => {
    if (!userFormData.username.trim()) { alert('Kullanıcı adı gerekli'); return; }
    if (!editingUser && !userFormData.password) { alert('Yeni kullanıcı için şifre gerekli'); return; }
    setUserSaving(true);
    try {
      const payload = {
        username: userFormData.username.trim(),
        name: userFormData.name,
        permissions: userFormData.permissions,
        isActive: userFormData.isActive,
      };
      if (userFormData.password) payload.password = userFormData.password;

      if (editingUser) {
        await authAxios.put(`${apiUrl}/api/users/${editingUser.id}`, payload);
      } else {
        await authAxios.post(`${apiUrl}/api/users`, payload);
      }
      setShowUserModal(false);
      const r = await authAxios.get(`${apiUrl}/api/users`);
      if (r.data.success) setUsers(r.data.data);
    } catch (error) {
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await authAxios.delete(`${apiUrl}/api/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      alert('Hata: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const openCreateModal = () => {
    setEditingPrice(null);
    setFormData({
      name: '',
      code: '',
      category: 'doviz',
      decimals: 0,
      alisConfig: {
        sourceCode: sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      },
      satisConfig: {
        sourceCode: sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      },
      backupAlisConfig: {
        sourceCode: backupSourcePrices[0]?.code || sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      },
      backupSatisConfig: {
        sourceCode: backupSourcePrices[0]?.code || sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      },
      activeSource: 'primary',
      manualSourceOverride: false
    });
    setShowModal(true);
  };

  const openEditModal = (price) => {
    setEditingPrice(price);
    // Eski fiyatlarda yedek config yoksa varsayılan ekle
    setFormData({
      ...price,
      backupAlisConfig: price.backupAlisConfig || {
        sourceCode: backupSourcePrices[0]?.code || sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      },
      backupSatisConfig: price.backupSatisConfig || {
        sourceCode: backupSourcePrices[0]?.code || sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      },
      activeSource: price.activeSource || 'primary',
      manualSourceOverride: price.manualSourceOverride || false
    });
    setShowModal(true);
  };

  // Manuel kaynak değiştirme
  const handleSwitchSource = async (priceCode, newSource) => {
    try {
      await authAxios.post(`${apiUrl}/api/prices/switch-source`, { priceCode, newSource });
      loadData();
      loadApiStatus();
    } catch (error) {
      console.error('Kaynak değiştirme hatası:', error);
      alert('Kaynak değiştirme başarısız!');
    }
  };

  // Tüm kaynakları değiştir
  const handleSwitchAllSources = async (newSource) => {
    if (!confirm(`Tüm fiyatlar için kaynak ${newSource === 'primary' ? 'Birincil' : 'Yedek'} olarak değiştirilecek. Devam edilsin mi?`)) return;
    try {
      await authAxios.post(`${apiUrl}/api/prices/switch-all-sources`, { newSource });
      loadData();
      loadApiStatus();
    } catch (error) {
      console.error('Toplu kaynak değiştirme hatası:', error);
      alert('Toplu kaynak değiştirme başarısız!');
    }
  };

  const handleSave = async () => {
    try {
      if (editingPrice) {
        await authAxios.put(`${apiUrl}/api/custom-prices/${editingPrice.id}`, formData);
      } else {
        // Yeni fiyat oluşturulurken order değerini en sona ekle
        const newPriceData = {
          ...formData,
          order: customPrices.length
        };
        await authAxios.post(`${apiUrl}/api/custom-prices`, newPriceData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu fiyatı silmek istediğinizden emin misiniz?')) return;

    try {
      await authAxios.delete(`${apiUrl}/api/custom-prices/${id}`);
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası yükleyin!');
        e.target.value = '';
        return;
      }
      
      // Dosya boyutu kontrolü (500KB önerilen limit)
      const fileSizeMB = file.size / 1024 / 1024;
      if (file.size > 500 * 1024) { // 500KB
        const proceed = confirm(
          `UYARI: Dosya boyutu ${fileSizeMB.toFixed(2)} MB\n\n` +
          `Önerilen maksimum: 0.5 MB\n\n` +
          `Büyük dosyalar yavaş yüklenebilir.\n` +
          `Devam etmek istiyor musunuz?`
        );
        if (!proceed) {
          e.target.value = '';
          return;
        }
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Size = reader.result.length / 1024 / 1024;
        console.log(`Logo yüklendi: Orijinal ${fileSizeMB.toFixed(2)}MB, Base64: ${base64Size.toFixed(2)}MB`);
        setLogoBase64(reader.result);
      };
      reader.onerror = () => {
        alert('Dosya okuma hatası! Lütfen tekrar deneyin.');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoBase64('');
    setLogoFile(null);
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya tipi kontrolü - favicon için ico, png destekle
      if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası yükleyin!');
        e.target.value = '';
        return;
      }

      // Dosya boyutu kontrolü (100KB önerilen limit)
      const fileSizeKB = file.size / 1024;
      if (file.size > 100 * 1024) { // 100KB
        const proceed = confirm(
          `UYARI: Dosya boyutu ${fileSizeKB.toFixed(2)} KB\n\n` +
          `Önerilen maksimum: 100 KB\n\n` +
          `Favicon için küçük dosyalar tercih edilmelidir.\n` +
          `Devam etmek istiyor musunuz?`
        );
        if (!proceed) {
          e.target.value = '';
          return;
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(`Favicon yüklendi: ${fileSizeKB.toFixed(2)}KB`);
        setFaviconBase64(reader.result);
      };
      reader.onerror = () => {
        alert('Dosya okuma hatası! Lütfen tekrar deneyin.');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFavicon = () => {
    setFaviconBase64('');
  };

  const handlePriceTableImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası yükleyin!');
        e.target.value = '';
        return;
      }

      const fileSizeMB = file.size / 1024 / 1024;
      if (file.size > 5 * 1024 * 1024) { // 5MB
        const proceed = confirm(
          `UYARI: Dosya boyutu ${fileSizeMB.toFixed(2)} MB\n\n` +
          `Önerilen maksimum: 5 MB\n\n` +
          `Büyük dosyalar yavaş yüklenebilir.\n` +
          `Devam etmek istiyor musunuz?`
        );
        if (!proceed) {
          e.target.value = '';
          return;
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(`Fiyat tablosu görseli yüklendi: ${fileSizeMB.toFixed(2)}MB`);
        setPriceTableImage(reader.result);
      };
      reader.onerror = () => {
        alert('Dosya okuma hatası! Lütfen tekrar deneyin.');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removePriceTableImage = () => {
    setPriceTableImage('');
  };

  const saveSettings = async () => {
    try {
      const payload = {
        maxDisplayItems,
        logoBase64,
        logoHeight,
        logoWidth,
        faviconBase64,
        priceTableImage,
        contactPhone,
        contactEmail,
        contactAddress,
        workingHours,
        workingHoursNote,
        socialFacebook,
        socialTwitter,
        socialInstagram,
        socialYoutube,
        socialTiktok,
        socialWhatsapp,
        ...(employeePassword && { employeePassword }),
        ...(businessPassword && { businessPassword }),
      };
      await authAxios.post(`${apiUrl}/api/settings`, payload);
      alert('Ayarlar kaydedildi!');
      setEmployeePassword('');
      setBusinessPassword('');
      loadData();
    } catch (error) {
      console.error('Ayar kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  // ==================== FAMILY CARDS HANDLERS ====================
  
  const openCreateFamilyModal = () => {
    setEditingFamily(null);
    setFamilyFormData({
      label: '',
      title: '',
      description: '',
      icon: 'TrendingUp',
      order: familyCards.length + 1
    });
    setShowFamilyModal(true);
  };

  const openEditFamilyModal = (card) => {
    setEditingFamily(card);
    setFamilyFormData(card);
    setShowFamilyModal(true);
  };

  const handleSaveFamily = async () => {
    try {
      if (editingFamily) {
        await authAxios.put(`${apiUrl}/api/family-cards/${editingFamily.id}`, familyFormData);
      } else {
        await authAxios.post(`${apiUrl}/api/family-cards`, familyFormData);
      }
      setShowFamilyModal(false);
      loadData();
    } catch (error) {
      console.error('Family kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDeleteFamily = async (id) => {
    if (!confirm('Bu kartı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await authAxios.delete(`${apiUrl}/api/family-cards/${id}`);
      loadData();
    } catch (error) {
      console.error('Family silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  // ==================== ARTICLES HANDLERS ====================
  
  const openCreateArticleModal = () => {
    setEditingArticle(null);
    setArticleFormData({
      category: 'Yatırım',
      title: '',
      description: '',
      content: '',
      icon: 'Coins',
      order: articles.length + 1
    });
    setShowArticleModal(true);
  };

  const openEditArticleModal = (article) => {
    setEditingArticle(article);
    setArticleFormData(article);
    setShowArticleModal(true);
  };

  const handleSaveArticle = async () => {
    try {
      if (editingArticle) {
        await authAxios.put(`${apiUrl}/api/articles/${editingArticle.id}`, articleFormData);
      } else {
        await authAxios.post(`${apiUrl}/api/articles`, articleFormData);
      }
      setShowArticleModal(false);
      loadData();
    } catch (error) {
      console.error('Makale kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Bu makaleyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await authAxios.delete(`${apiUrl}/api/articles/${id}`);
      loadData();
    } catch (error) {
      console.error('Makale silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  // ==================== BRANCHES HANDLERS ====================

  const openCreateBranchModal = () => {
    setEditingBranch(null);
    setBranchFormData({
      name: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      workingHours: '09:00 - 18:00',
      mapLink: '',
      companyTitle: '',
      taxOffice: '',
      taxNumber: '',
      tradeRegistryNo: ''
    });
    setShowBranchModal(true);
  };

  const openEditBranchModal = (branch) => {
    setEditingBranch(branch);
    setBranchFormData({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone || '',
      email: branch.email || '',
      workingHours: branch.workingHours || '09:00 - 18:00',
      mapLink: branch.mapLink || '',
      companyTitle: branch.companyTitle || '',
      taxOffice: branch.taxOffice || '',
      taxNumber: branch.taxNumber || '',
      tradeRegistryNo: branch.tradeRegistryNo || ''
    });
    setShowBranchModal(true);
  };

  const handleSaveBranch = async () => {
    if (!branchFormData.name || !branchFormData.city || !branchFormData.address) {
      alert('Şube adı, şehir ve adres zorunludur!');
      return;
    }

    try {
      if (editingBranch) {
        await authAxios.put(`${apiUrl}/api/branches/${editingBranch.id}`, branchFormData);
      } else {
        await authAxios.post(`${apiUrl}/api/branches`, branchFormData);
      }
      setShowBranchModal(false);
      loadData();
    } catch (error) {
      console.error('Şube kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await authAxios.delete(`${apiUrl}/api/branches/${id}`);
      loadData();
    } catch (error) {
      console.error('Şube silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  // ==================== TRANSACTIONS HANDLERS ====================

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const res = await authAxios.get(`${apiUrl}/api/transactions`);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (error) {
      console.error('Transactions yükleme hatası:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Arama filtresi
      if (txSearch) {
        const q = txSearch.toLowerCase();
        const matchName = tx.fullName?.toLowerCase().includes(q);
        const matchId = tx.identityNumber?.toLowerCase().includes(q);
        const matchPhone = tx.phone?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPhone) return false;
      }
      // Şube filtresi
      if (txBranchFilter !== 'all') {
        if (tx.branchId?._id !== txBranchFilter) return false;
      }
      // Durum filtresi
      if (txStatusFilter !== 'all') {
        if (tx.status !== txStatusFilter) return false;
      }
      // Tarih aralığı filtresi
      if (txDateFrom) {
        const txDate = new Date(tx.date).toISOString().split('T')[0];
        if (txDate < txDateFrom) return false;
      }
      if (txDateTo) {
        const txDate = new Date(tx.date).toISOString().split('T')[0];
        if (txDate > txDateTo) return false;
      }
      return true;
    });
  }, [transactions, txSearch, txBranchFilter, txStatusFilter, txDateFrom, txDateTo]);

  const txBranchOptions = useMemo(() => {
    const map = new Map();
    transactions.forEach(tx => {
      if (tx.branchId?._id && tx.branchId?.name) {
        map.set(tx.branchId._id, tx.branchId.name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [transactions]);

  const handleDownloadPdf = async (txId) => {
    try {
      const response = await authAxios.get(`${apiUrl}/api/transactions/pdf/${txId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `musteri-tani-formu-${txId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      alert('PDF indirilemedi!');
    }
  };

  const openTxEditModal = (tx) => {
    setEditingTx(tx);
    setTxFormData({
      fullName: tx.fullName || '',
      identityNumber: tx.identityNumber || '',
      phone: tx.phone || '',
      occupation: tx.occupation || '',
      address: tx.address || '',
      date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
      branchId: tx.branchId?._id || '',
      transactionType: tx.transactionType || 'alis',
      totalAmount: tx.totalAmount || '',
      details: tx.details || '',
      additionalInfo: tx.additionalInfo || '',
      status: tx.status || 'pending'
    });
    setShowTxEditModal(true);
  };

  const handleTxUpdate = async () => {
    if (!editingTx) return;
    try {
      const payload = { ...txFormData, totalAmount: Number(txFormData.totalAmount) };
      await authAxios.put(`${apiUrl}/api/transactions/${editingTx.id}`, payload);
      setShowTxEditModal(false);
      setEditingTx(null);
      loadTransactions();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Güncelleme başarısız!');
    }
  };

  const handleTxDelete = async (txId, txName) => {
    if (!confirm(`"${txName}" isimli işlemi silmek istediğinize emin misiniz?`)) return;
    try {
      await authAxios.delete(`${apiUrl}/api/transactions/${txId}`);
      loadTransactions();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  // ==================== İŞLETME FİYATLARI HANDLERS ====================

  const loadBusinessPrices = async () => {
    try {
      const res = await authAxios.get(`${apiUrl}/api/business/prices`);
      if (res.data.success) setBusinessPrices(res.data.data || []);
    } catch (error) {
      console.error('İşletme fiyatları yükleme hatası:', error);
    }
  };

  useEffect(() => {
    if (activeTab !== 'businessPrices') return;
    loadBusinessPrices();
    const interval = setInterval(loadBusinessPrices, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleBusinessEditChange = (code, field, value) => {
    setBusinessEdits(prev => ({
      ...prev,
      [code]: { ...(prev[code] || {}), [field]: value }
    }));
  };

  const getBusinessEditValue = (price, field) => {
    const edited = businessEdits[price.code]?.[field];
    if (edited !== undefined) return edited;
    const overrideField = {
      alisMultiplier: 'businessAlisMultiplier',
      alisAddition: 'businessAlisAddition',
      satisMultiplier: 'businessSatisMultiplier',
      satisAddition: 'businessSatisAddition'
    }[field];
    const v = price[overrideField];
    return v === null || v === undefined ? '' : String(v);
  };

  const saveBusinessRow = async (price) => {
    setBusinessSavingCode(price.code);
    try {
      await authAxios.put(`${apiUrl}/api/business/coefficients`, {
        code: price.code,
        alisMultiplier: getBusinessEditValue(price, 'alisMultiplier'),
        alisAddition: getBusinessEditValue(price, 'alisAddition'),
        satisMultiplier: getBusinessEditValue(price, 'satisMultiplier'),
        satisAddition: getBusinessEditValue(price, 'satisAddition')
      });
      setBusinessEdits(prev => { const n = { ...prev }; delete n[price.code]; return n; });
      await loadBusinessPrices();
    } catch (error) {
      console.error('İşletme katsayı kaydetme hatası:', error);
      alert('Kayıt başarısız: ' + (error.response?.data?.message || error.message));
    } finally {
      setBusinessSavingCode(null);
    }
  };

  const resetBusinessRow = async (price) => {
    setBusinessSavingCode(price.code);
    try {
      await authAxios.delete(`${apiUrl}/api/business/coefficients/${encodeURIComponent(price.code)}`);
      setBusinessEdits(prev => { const n = { ...prev }; delete n[price.code]; return n; });
      await loadBusinessPrices();
    } catch (error) {
      console.error('Sıfırlama hatası:', error);
    } finally {
      setBusinessSavingCode(null);
    }
  };

  const fmtNum = (v, decimals = 2) => {
    if (v === null || v === undefined || isNaN(v)) return '-';
    return Number(v).toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // ==================== DRAG & DROP HANDLERS ====================
  
  const handleDragStart = (e, price) => {
    setDraggedItem(price);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, price) => {
    e.preventDefault();
    setDraggedOverItem(price);
  };

  const handleDragEnd = async () => {
    if (!draggedItem || !draggedOverItem || draggedItem.id === draggedOverItem.id) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    // Önce mevcut listeyi order'a göre sırala
    const sortedPrices = [...customPrices].sort((a, b) => (a.order || 0) - (b.order || 0));

    const draggedIndex = sortedPrices.findIndex(p => p.id === draggedItem.id);
    const targetIndex = sortedPrices.findIndex(p => p.id === draggedOverItem.id);

    // Array'den çıkar ve yeni pozisyona ekle
    const [removed] = sortedPrices.splice(draggedIndex, 1);
    sortedPrices.splice(targetIndex, 0, removed);

    // Order değerlerini güncelle (0'dan başlayarak)
    const updatedPrices = sortedPrices.map((price, index) => ({
      ...price,
      order: index
    }));

    // State'i güncelle
    setCustomPrices(updatedPrices);

    // Backend'e sıralama gönder
    try {
      const orders = updatedPrices.map(price => ({
        id: price.id,
        order: price.order
      }));
      await authAxios.put(`${apiUrl}/api/custom-prices/reorder`, { orders });
      console.log('✅ Sıralama kaydedildi');
    } catch (error) {
      console.error('❌ Sıralama kaydetme hatası:', error);
      alert('Sıralama kaydedilemedi!');
      loadData(); // Hata durumunda yeniden yükle
    }

    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // Toplu güncelleme: paneli açınca mevcut addition değerlerini yükle
  const initBulkAdditions = (target) => {
    const additions = {};
    customPrices.forEach(price => {
      if (target === 'primary') {
        additions[price.id] = {
          alis: price.alisConfig?.addition ?? 0,
          satis: price.satisConfig?.addition ?? 0
        };
      } else if (target === 'backup') {
        additions[price.id] = {
          alis: price.backupAlisConfig?.addition ?? 0,
          satis: price.backupSatisConfig?.addition ?? 0
        };
      } else {
        additions[price.id] = {
          alis: price.alisConfig?.addition ?? 0,
          satis: price.satisConfig?.addition ?? 0,
          backupAlis: price.backupAlisConfig?.addition ?? 0,
          backupSatis: price.backupSatisConfig?.addition ?? 0
        };
      }
    });
    setBulkAdditions(additions);
  };

  // Toplu güncelleme: tümüne aynı değeri ekle/çıkar
  const applyBulkDelta = (delta, field) => {
    setBulkAdditions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id] = { ...updated[id] };
        if (field === 'alis' || field === 'both') {
          updated[id].alis = parseFloat(((updated[id].alis || 0) + delta).toFixed(4));
          if (bulkTarget === 'all') updated[id].backupAlis = parseFloat(((updated[id].backupAlis || 0) + delta).toFixed(4));
        }
        if (field === 'satis' || field === 'both') {
          updated[id].satis = parseFloat(((updated[id].satis || 0) + delta).toFixed(4));
          if (bulkTarget === 'all') updated[id].backupSatis = parseFloat(((updated[id].backupSatis || 0) + delta).toFixed(4));
        }
      });
      return updated;
    });
  };

  // Toplu güncelleme: kaydet
  const handleBulkSave = async () => {
    if (!confirm('Tüm fiyatların ekleme/çıkarma değerleri güncellenecek. Onaylıyor musunuz?')) return;
    setBulkSaving(true);
    try {
      const updates = Object.entries(bulkAdditions).map(([id, vals]) => ({
        id,
        alisAddition: vals.alis,
        satisAddition: vals.satis
      }));

      await authAxios.put(`${apiUrl}/api/custom-prices/bulk-update`, { target: bulkTarget, updates });

      // Tümü seçiliyse backup değerlerini de ayrı gönder
      if (bulkTarget === 'all') {
        const backupUpdates = Object.entries(bulkAdditions).map(([id, vals]) => ({
          id,
          alisAddition: vals.backupAlis,
          satisAddition: vals.backupSatis
        }));
        await authAxios.put(`${apiUrl}/api/custom-prices/bulk-update`, { target: 'backup', updates: backupUpdates });
      }

      await loadData();
      setShowBulkUpdate(false);
      alert('Toplu güncelleme başarılı!');
    } catch (err) {
      alert('Hata: ' + (err.response?.data?.message || err.message));
    } finally {
      setBulkSaving(false);
    }
  };

  const calculatePreview = (config, customSourcePrices = null) => {
    if (!config || !config.sourceCode) return 0;
    const prices = customSourcePrices || sourcePrices;
    let source = prices.find(p => p.code === config.sourceCode);

    // API kaynağında bulunamadıysa custom fiyatlarda ara (zincirleme fiyat desteği)
    if (!source && websocketPrices) {
      const customSource = websocketPrices.find(p => p.isCustom && p.code === config.sourceCode);
      if (customSource) {
        source = {
          rawAlis: customSource.calculatedAlis || 0,
          rawSatis: customSource.calculatedSatis || 0
        };
      }
    }
    if (!source) return 0;

    const rawPrice = config.sourceType === 'alis' ? source.rawAlis : source.rawSatis;
    return (rawPrice * (config.multiplier || 1)) + (config.addition || 0);
  };

  // Toplu güncelleme: düzenlenen addition ile canlı fiyat önizleme
  const calculateBulkPreview = (config, overrideAddition, customSourcePrices = null) => {
    if (!config || !config.sourceCode) return 0;
    const prices = customSourcePrices || sourcePrices;
    let source = prices.find(p => p.code === config.sourceCode);

    // API kaynağında bulunamadıysa custom fiyatlarda ara (zincirleme fiyat desteği)
    if (!source && websocketPrices) {
      const customSource = websocketPrices.find(p => p.isCustom && p.code === config.sourceCode);
      if (customSource) {
        source = {
          rawAlis: customSource.calculatedAlis || 0,
          rawSatis: customSource.calculatedSatis || 0
        };
      }
    }
    if (!source) return 0;
    const rawPrice = config.sourceType === 'alis' ? source.rawAlis : source.rawSatis;
    return (rawPrice * (config.multiplier || 1)) + (overrideAddition || 0);
  };

  const formatPrice = (value, decimals = 0) => {
    if (!value) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Sıra numarası değiştirme fonksiyonu
  const handleOrderChange = async (priceId, newOrder) => {
    const orderNum = parseInt(newOrder);
    if (isNaN(orderNum) || orderNum < 0) return;

    // Mevcut listeyi order'a göre sırala
    const sortedPrices = [...customPrices].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Değiştirilen öğeyi bul ve listeden çıkar
    const currentIndex = sortedPrices.findIndex(p => p.id === priceId);
    const [movedItem] = sortedPrices.splice(currentIndex, 1);

    // Yeni pozisyona ekle (orderNum sınırları içinde)
    const newIndex = Math.min(Math.max(0, orderNum), sortedPrices.length);
    sortedPrices.splice(newIndex, 0, movedItem);

    // Tüm order'ları yeniden numarala (0'dan başlayarak)
    const updatedPrices = sortedPrices.map((price, index) => ({
      ...price,
      order: index
    }));

    // State'i güncelle
    setCustomPrices(updatedPrices);

    // Backend'e sıralama gönder - her bir fiyatı ayrı güncelle
    try {
      await Promise.all(updatedPrices.map(price =>
        authAxios.put(`${apiUrl}/api/custom-prices/${price.id}`, { order: price.order })
      ));
      console.log('✅ Sıra numaraları güncellendi');
    } catch (error) {
      console.error('❌ Sıra güncelleme hatası:', error);
    }
  };

  const filteredPrices = customPrices
    .filter(p => {
      if (filter !== 'all' && p.category !== filter) return false;
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Fiyat Yönetimi</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="hidden md:inline-flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Menüyü aç"
                    aria-label="Menüyü aç"
                  >
                    <PanelLeft size={22} />
                  </button>
                )}
                <div className="flex items-center space-x-3">
                  {logoBase64 ? (
                    <img 
                      src={logoBase64} 
                      alt="Logo" 
                      className="object-contain" 
                      style={{ 
                        height: `${logoHeight}px`, 
                        width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                        maxWidth: '300px'
                      }} 
                    />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                        <TrendingUp className="text-white" size={22} />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">Admin Paneli</h1>
                        <p className="text-xs text-gray-500">Fiyat Yönetimi</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* WebSocket Bağlantı Durumu */}
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                  <span className="text-xs font-semibold">{isConnected ? 'Canlı' : 'Bağlantı Yok'}</span>
                </div>

                {/* Masaüstü aksiyonları */}
                <div className="hidden md:flex items-center space-x-3">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors font-medium"
                  title="Siteye Git"
                >
                  <ExternalLink size={18} />
                  <span>Siteye Git</span>
                </a>
                {can('seo') && (
                <Link
                  href="/admin/seo"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
                  title="SEO & Analytics"
                >
                  <Search size={18} />
                  <span>SEO</span>
                </Link>
                )}
                {can('legal') && (
                <Link
                  href="/admin/legal"
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-medium"
                  title="Yasal Sayfalar"
                >
                  <FileText size={18} />
                  <span>Yasal</span>
                </Link>
                )}
                {can('settings') && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                  title="Ayarlar"
                >
                  <Settings size={18} />
                  <span>Ayarlar</span>
                </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                >
                  <LogOut size={18} />
                  <span>Çıkış</span>
                </button>
                </div>

                {/* Mobil hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(o => !o)}
                  className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Menü"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>

            {/* Mobil açılır menü */}
            {mobileMenuOpen && (
              <div className="md:hidden py-3 border-t border-gray-200 animate-fade-in">
                <nav className="flex flex-col space-y-1">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'bg-amber-50 text-amber-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col space-y-1">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm text-amber-700 hover:bg-amber-50"
                  >
                    <ExternalLink size={18} />
                    <span>Siteye Git</span>
                  </a>
                  {can('seo') && (
                  <Link
                    href="/admin/seo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm text-blue-700 hover:bg-blue-50"
                  >
                    <Search size={18} />
                    <span>SEO & Analytics</span>
                  </Link>
                  )}
                  {can('legal') && (
                  <Link
                    href="/admin/legal"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm text-purple-700 hover:bg-purple-50"
                  >
                    <FileText size={18} />
                    <span>Yasal Sayfalar</span>
                  </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut size={18} />
                    <span>Çıkış</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sekme menüsü (masaüstü, sol dikey) */}
        <aside className={`hidden ${sidebarOpen ? 'md:block' : ''} w-64 shrink-0 bg-white border-r border-gray-200`}>
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex justify-end px-2 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Menüyü kapat"
                aria-label="Menüyü kapat"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>
            <nav className="flex flex-col px-3 pb-3 space-y-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-amber-50 text-amber-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 py-8">
          {/* ==================== FIYAT YÖNETİMİ TAB ==================== */}
          {activeTab === 'prices' && (
          <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Kaynak Fiyatlar</p>
                  <p className="text-3xl font-bold text-gray-900">{sourcePrices.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Oluşturulan Fiyatlar</p>
                  <p className="text-3xl font-bold text-gray-900">{customPrices.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Save className="text-amber-600" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Kategori</p>
                  <p className="text-3xl font-bold text-gray-900">{filter === 'all' ? 'Tümü' : filter === 'altin' ? 'Altın' : filter === 'doviz' ? 'Döviz' : 'Gümüş'}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className={`rounded-xl border-2 p-6 shadow-sm transition-all ${
              isConnected 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold mb-1 ${isConnected ? 'text-green-700' : 'text-orange-700'}`}>
                    Son Güncelleme
                  </p>
                  {lastUpdate ? (
                    <>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(lastUpdate).toLocaleTimeString('tr-TR')}
                      </p>
                      <p className={`text-xs mt-1 font-semibold ${isConnected ? 'text-green-600' : 'text-orange-600'}`}>
                        {timeSinceUpdate}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Bekleniyor...</p>
                  )}
                  {!isConnected && lastUpdate && (
                    <p className="text-xs text-orange-700 mt-2 flex items-center space-x-1">
                      <AlertCircle size={12} />
                      <span>Bağlantı kesildi</span>
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isConnected ? 'bg-green-500' : 'bg-orange-500'
                }`}>
                  <RefreshCw className={`text-white ${isConnected ? 'animate-spin' : ''}`} size={24} style={{animationDuration: '3s'}} />
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'all' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tümü ({customPrices.length})
                </button>
                <button
                  onClick={() => setFilter('altin')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'altin' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Altın ({customPrices.filter(p => p.category === 'altin').length})
                </button>
                <button
                  onClick={() => setFilter('doviz')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'doviz' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Döviz ({customPrices.filter(p => p.category === 'doviz').length})
                </button>
                <button
                  onClick={() => setFilter('gumus')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'gumus' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Gümüş ({customPrices.filter(p => p.category === 'gumus').length})
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!showBulkUpdate) initBulkAdditions(bulkTarget);
                    setShowBulkUpdate(!showBulkUpdate);
                  }}
                  className={`flex items-center space-x-2 px-6 py-2.5 ${showBulkUpdate ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors font-semibold shadow-sm whitespace-nowrap`}
                >
                  <Edit2 size={18} />
                  <span>Toplu Güncelleme</span>
                </button>
                <button
                  onClick={openCreateModal}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm whitespace-nowrap"
                >
                  <Plus size={18} />
                  <span>Yeni Fiyat Oluştur</span>
                </button>
              </div>
            </div>
          </div>

          {/* Fiyat Kaynağı Kontrol Paneli */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex flex-col gap-4">
              {/* Üst Satır: Başlık ve Kaynak Seçimi */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${apiStatus?.activeSource === 'backup' ? 'bg-orange-500' : 'bg-amber-500'}`}>
                    <RefreshCw className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Fiyat Kaynağı Yönetimi</h3>
                    <div className="flex items-center space-x-3 text-xs mt-1">
                      <span className={`flex items-center space-x-1 ${apiStatus?.primary?.connected ? 'text-green-600' : 'text-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${apiStatus?.primary?.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>API 1: {apiStatus?.primary?.connected ? 'Bağlı' : 'Yok'}</span>
                      </span>
                      <span className={`flex items-center space-x-1 ${apiStatus?.backup?.connected ? 'text-orange-600' : 'text-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${apiStatus?.backup?.connected ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                        <span>API 2: {apiStatus?.backup?.connected ? 'Bağlı' : 'Yok'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${apiUrl}/api/prices/switch-all-sources`, { newSource: 'primary' });
                        loadApiStatus();
                      } catch (err) {
                        alert('Hata: ' + err.message);
                      }
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      apiStatus?.activeSource === 'primary'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Birincil (API 1)
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${apiUrl}/api/prices/switch-all-sources`, { newSource: 'backup' });
                        loadApiStatus();
                      } catch (err) {
                        alert('Hata: ' + err.message);
                      }
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      apiStatus?.activeSource === 'backup'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Yedek (API 2)
                  </button>
                </div>
              </div>
              {/* Alt Satır: Timeout Ayarı */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">Otomatik yedek kaynağa geçiş süresi:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    defaultValue={apiStatus?.fallbackTimeoutMinutes || 30}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm font-medium text-gray-900 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    id="fallbackMinutesInput"
                  />
                  <span className="text-sm text-gray-600">dakika</span>
                  <button
                    onClick={async () => {
                      const input = document.getElementById('fallbackMinutesInput');
                      const minutes = parseInt(input.value) || 30;
                      try {
                        await axios.post(`${apiUrl}/api/prices/set-fallback-timeout`, { minutes });
                        loadApiStatus();
                        alert(`Geçiş süresi ${minutes} dakika olarak ayarlandı`);
                      } catch (err) {
                        alert('Hata: ' + err.message);
                      }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl mb-6 shadow-sm overflow-hidden">
            <button
              onClick={() => {
                if (!showBulkUpdate) {
                  initBulkAdditions(bulkTarget);
                }
                setShowBulkUpdate(!showBulkUpdate);
              }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Settings className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">Toplu Fiyat Güncelleme</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tüm fiyatlara toplu ekleme/çıkarma yap</p>
                </div>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showBulkUpdate ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showBulkUpdate && (
              <div className="border-t border-gray-200 p-5">
                {/* Kaynak Seçimi + Toplu Ekle/Çıkar */}
                <div className="flex flex-col md:flex-row md:items-end gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Düzenlenecek Kaynak</label>
                    <select
                      value={bulkTarget}
                      onChange={(e) => {
                        setBulkTarget(e.target.value);
                        initBulkAdditions(e.target.value);
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    >
                      <option value="primary">Birincil (API 1)</option>
                      <option value="backup">Yedek (API 2)</option>
                      <option value="all">Tümü</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2 ml-auto">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tümüne Ekle/Çıkar (TL)</label>
                      <input
                        type="number"
                        step="0.01"
                        id="bulkDeltaInput"
                        defaultValue="0"
                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center font-mono bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const val = parseFloat(document.getElementById('bulkDeltaInput').value) || 0;
                        if (val === 0) return;
                        applyBulkDelta(val, 'alis');
                      }}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Alışa Uygula
                    </button>
                    <button
                      onClick={() => {
                        const val = parseFloat(document.getElementById('bulkDeltaInput').value) || 0;
                        if (val === 0) return;
                        applyBulkDelta(val, 'satis');
                      }}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Satışa Uygula
                    </button>
                    <button
                      onClick={() => {
                        const val = parseFloat(document.getElementById('bulkDeltaInput').value) || 0;
                        if (val === 0) return;
                        applyBulkDelta(val, 'both');
                      }}
                      className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      İkisine Uygula
                    </button>
                  </div>
                </div>

                {/* Fiyat Tablosu */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-bold text-gray-700">Fiyat</th>
                        {bulkTarget !== 'all' ? (
                          <>
                            <th className="text-center px-3 py-3 font-bold text-green-700">Alış Ekleme (TL)</th>
                            <th className="text-center px-3 py-3 font-bold text-red-700">Satış Ekleme (TL)</th>
                            <th className="text-right px-3 py-3 font-bold text-green-700">Hesaplanan Alış</th>
                            <th className="text-right px-3 py-3 font-bold text-red-700">Hesaplanan Satış</th>
                          </>
                        ) : (
                          <>
                            <th className="text-center px-2 py-3 font-bold text-green-700 text-xs">API 1 Alış</th>
                            <th className="text-center px-2 py-3 font-bold text-red-700 text-xs">API 1 Satış</th>
                            <th className="text-right px-2 py-3 font-bold text-green-600 text-xs">API 1 H.Alış</th>
                            <th className="text-right px-2 py-3 font-bold text-red-600 text-xs">API 1 H.Satış</th>
                            <th className="text-center px-2 py-3 font-bold text-orange-600 text-xs">API 2 Alış</th>
                            <th className="text-center px-2 py-3 font-bold text-amber-600 text-xs">API 2 Satış</th>
                            <th className="text-right px-2 py-3 font-bold text-orange-500 text-xs">API 2 H.Alış</th>
                            <th className="text-right px-2 py-3 font-bold text-amber-500 text-xs">API 2 H.Satış</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {customPrices.map((price, index) => {
                        const vals = bulkAdditions[price.id] || { alis: 0, satis: 0, backupAlis: 0, backupSatis: 0 };
                        // Seçilen kaynağa göre hesaplanmış fiyat önizlemesi
                        const alisConfig = bulkTarget === 'backup' ? price.backupAlisConfig : price.alisConfig;
                        const satisConfig = bulkTarget === 'backup' ? price.backupSatisConfig : price.satisConfig;
                        const previewSrc = bulkTarget === 'backup' ? backupSourcePrices : null;
                        const previewAlis = calculateBulkPreview(alisConfig, vals.alis, previewSrc);
                        const previewSatis = calculateBulkPreview(satisConfig, vals.satis, previewSrc);
                        // Tümü modunda backup fiyatları da
                        const bkpPreviewAlis = bulkTarget === 'all' ? calculateBulkPreview(price.backupAlisConfig, vals.backupAlis, backupSourcePrices) : 0;
                        const bkpPreviewSatis = bulkTarget === 'all' ? calculateBulkPreview(price.backupSatisConfig, vals.backupSatis, backupSourcePrices) : 0;

                        return (
                          <tr key={price.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-gray-900">{price.name}</div>
                              <div className="text-xs text-gray-400">{price.code}</div>
                            </td>
                            {bulkTarget !== 'all' ? (
                              <>
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={vals.alis}
                                    onChange={(e) => setBulkAdditions(prev => ({
                                      ...prev,
                                      [price.id]: { ...prev[price.id], alis: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-28 px-2 py-1.5 border border-green-200 rounded-lg text-center font-mono text-sm text-gray-900 bg-green-50/50 focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={vals.satis}
                                    onChange={(e) => setBulkAdditions(prev => ({
                                      ...prev,
                                      [price.id]: { ...prev[price.id], satis: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-28 px-2 py-1.5 border border-red-200 rounded-lg text-center font-mono text-sm text-gray-900 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <span className="font-mono font-bold text-green-700">{formatPrice(previewAlis, price.decimals ?? 0)}</span>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <span className="font-mono font-bold text-red-700">{formatPrice(previewSatis, price.decimals ?? 0)}</span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-2 py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={vals.alis}
                                    onChange={(e) => setBulkAdditions(prev => ({
                                      ...prev,
                                      [price.id]: { ...prev[price.id], alis: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-20 px-1 py-1.5 border border-green-200 rounded-lg text-center font-mono text-xs text-gray-900 bg-green-50/50 focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={vals.satis}
                                    onChange={(e) => setBulkAdditions(prev => ({
                                      ...prev,
                                      [price.id]: { ...prev[price.id], satis: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-20 px-1 py-1.5 border border-red-200 rounded-lg text-center font-mono text-xs text-gray-900 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-right">
                                  <span className="font-mono font-bold text-sm text-green-700">{formatPrice(previewAlis, price.decimals ?? 0)}</span>
                                </td>
                                <td className="px-2 py-2.5 text-right">
                                  <span className="font-mono font-bold text-sm text-red-700">{formatPrice(previewSatis, price.decimals ?? 0)}</span>
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={vals.backupAlis ?? 0}
                                    onChange={(e) => setBulkAdditions(prev => ({
                                      ...prev,
                                      [price.id]: { ...prev[price.id], backupAlis: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-20 px-1 py-1.5 border border-orange-200 rounded-lg text-center font-mono text-xs text-gray-900 bg-orange-50/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={vals.backupSatis ?? 0}
                                    onChange={(e) => setBulkAdditions(prev => ({
                                      ...prev,
                                      [price.id]: { ...prev[price.id], backupSatis: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-20 px-1 py-1.5 border border-amber-200 rounded-lg text-center font-mono text-xs text-gray-900 bg-amber-50/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-right">
                                  <span className="font-mono font-bold text-sm text-orange-600">{formatPrice(bkpPreviewAlis, price.decimals ?? 0)}</span>
                                </td>
                                <td className="px-2 py-2.5 text-right">
                                  <span className="font-mono font-bold text-sm text-amber-600">{formatPrice(bkpPreviewSatis, price.decimals ?? 0)}</span>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Kaydet Butonu */}
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowBulkUpdate(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleBulkSave}
                    disabled={bulkSaving}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{bulkSaving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fiyat Listesi */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {filteredPrices.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-gray-400">
                  <Plus size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Henüz fiyat oluşturulmadı</p>
                  <p className="text-sm mb-4">Yeni bir fiyat oluşturarak başlayın</p>
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Plus size={18} />
                    <span>İlk Fiyatı Oluştur</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-center px-2 py-4 text-sm font-bold text-gray-700 w-10"></th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Fiyat Bilgisi</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Alış Kaynağı</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Satış Kaynağı</th>
                      <th className="text-right px-4 py-4 text-sm font-bold text-gray-700">Hesaplanan Alış</th>
                      <th className="text-right px-4 py-4 text-sm font-bold text-gray-700">Hesaplanan Satış</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrices.map((price, index) => {
                      const alisPreview = calculatePreview(price.alisConfig);
                      const satisPreview = calculatePreview(price.satisConfig);
                      const isDragging = draggedItem?.id === price.id;
                      const isDraggedOver = draggedOverItem?.id === price.id;
                      
                      return (
                        <tr
                          key={price.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, price)}
                          onDragEnter={(e) => handleDragEnter(e, price)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          className={`border-b border-gray-100 transition-all ${
                            isDragging
                              ? 'opacity-50 bg-blue-50'
                              : isDraggedOver
                                ? 'bg-amber-100 border-l-4 border-l-amber-500'
                                : index % 2 === 0
                                  ? 'bg-white hover:bg-amber-50'
                                  : 'bg-gray-50/50 hover:bg-amber-50'
                          }`}
                          style={{ cursor: 'grab' }}
                        >
                          <td className="px-2 py-4 text-center">
                            <GripVertical
                              size={18}
                              className="mx-auto text-gray-400 hover:text-gray-600 transition-colors"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{price.name}</div>
                              <div className="text-xs text-gray-500">{price.code}</div>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                                price.category === 'altin' ? 'bg-amber-100 text-amber-700' :
                                price.category === 'doviz' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {price.category === 'altin' ? 'Altın' : price.category === 'doviz' ? 'Döviz' : 'Gümüş'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-700">{price.alisConfig.sourceCode}</div>
                            <div className="text-xs text-gray-500">
                              {price.alisConfig.sourceType === 'alis' ? 'Alış' : 'Satış'} × {price.alisConfig.multiplier} + {price.alisConfig.addition}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-700">{price.satisConfig.sourceCode}</div>
                            <div className="text-xs text-gray-500">
                              {price.satisConfig.sourceType === 'alis' ? 'Alış' : 'Satış'} × {price.satisConfig.multiplier} + {price.satisConfig.addition}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-green-700 font-mono font-bold text-lg">₺{formatPrice(alisPreview, price.decimals ?? 0)}</div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-red-700 font-mono font-bold text-lg">₺{formatPrice(satisPreview, price.decimals ?? 0)}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => openEditModal(price)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                                title="Düzenle"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(price.id)}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                title="Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
          )}

          {/* ==================== İŞLETME FİYATLARI TAB ==================== */}
          {activeTab === 'businessPrices' && (
          <>
            {/* Başlık kartı (sitenin altın header dili) */}
            <div className="bg-[#F3BA1C] rounded-[10px] px-6 py-5 mb-5 shadow-[0_10px_30px_rgba(16,24,40,0.08)]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur flex items-center justify-center">
                    <Building2 size={20} className="text-gray-900" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">İŞLETME FİYATLARI</h2>
                    <p className="text-xs text-gray-800/80 uppercase tracking-wider">Şube içi özel fiyatlandırma yönetimi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-white/30 backdrop-blur rounded-lg">
                    <div className="text-[10px] text-gray-900/80 uppercase tracking-wider leading-tight">Toplam</div>
                    <div className="text-lg font-bold text-gray-900 leading-tight">{businessPrices.length}</div>
                  </div>
                  <div className="px-3 py-1.5 bg-white/50 backdrop-blur rounded-lg">
                    <div className="text-[10px] text-gray-900/80 uppercase tracking-wider leading-tight">Özel</div>
                    <div className="text-lg font-bold text-gray-900 leading-tight">
                      {businessPrices.filter(p => p.hasBusinessOverride).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bilgi kutusu */}
            <div className="bg-white rounded-[10px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-4 mb-5 border-l-4 border-[#F3BA1C]">
              <p className="text-sm text-[#111827]">
                <strong>Nasıl çalışır?</strong> Soldaki <span className="text-[#9aa0a6]">müşteri katsayıları</span> (Fiyat Yönetimi'nde belirlediğin) salt okunurdur. Sağdaki <span className="font-semibold text-[#b88a2b]">İşletme Katsayısı</span> kutularına değer yazarsan, çalışanlar <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/isletme-fiyatlari</code> sayfasında o değeri görür. Boş bıraktığın alan normal değeri kullanır.
              </p>
              <p className="text-xs text-[#9aa0a6] mt-1">
                Formül: <code className="bg-gray-100 px-1.5 py-0.5 rounded">ham fiyat × çarpan + ekleme</code>
              </p>
            </div>

            {/* Fiyat tablosu — anasayfa tablosu ile aynı estetikte */}
            <section className="bg-white rounded-[10px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-6 pb-4 overflow-hidden">
              <h3 className="text-center text-[18px] tracking-[0.08em] text-[#111827] font-normal mb-3">
                FİYAT LİSTESİ VE İŞLETME KATSAYILARI
              </h3>
              <div className="h-px bg-[#e9ecef] mb-3"></div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="py-3 px-3 text-left text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef]">
                        Ürün
                      </th>
                      <th className="py-3 px-3 text-center text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef]">
                        Müşteri Alış Katsayısı
                      </th>
                      <th className="py-3 px-3 text-center text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef]">
                        Müşteri Satış Katsayısı
                      </th>
                      <th className="py-3 px-3 text-center text-[#b88a2b] font-normal text-sm border-b border-[#e9ecef] bg-[#F3BA1C]/10">
                        İşletme Alış (çarpan + ekleme)
                      </th>
                      <th className="py-3 px-3 text-center text-[#b88a2b] font-normal text-sm border-b border-[#e9ecef] bg-[#F3BA1C]/10">
                        İşletme Satış (çarpan + ekleme)
                      </th>
                      <th className="py-3 px-3 text-right text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef]">
                        Alış / Satış
                      </th>
                      <th className="py-3 px-3 text-center text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef]">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessPrices.length === 0 && (
                      <tr><td colSpan={7} className="py-16 text-center text-[#9aa0a6]">Fiyat bekleniyor...</td></tr>
                    )}
                    {[...businessPrices].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map(p => {
                      const isDirty = !!businessEdits[p.code];
                      return (
                        <tr
                          key={p.code}
                          className={`hover:bg-[#F3BA1C]/5 transition-colors ${p.hasBusinessOverride ? 'bg-[#F3BA1C]/5' : ''}`}
                        >
                          {/* Ürün */}
                          <td className="py-3 px-3 border-b border-[#e9ecef] align-middle">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-bold text-base text-[#111827] tracking-wide uppercase">{p.name}</div>
                                <div className="text-xs text-[#9aa0a6] uppercase">{p.code}</div>
                              </div>
                              {p.hasBusinessOverride && (
                                <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded bg-[#F3BA1C] text-gray-900 uppercase tracking-wider">Özel</span>
                              )}
                            </div>
                          </td>

                          {/* Müşteri Alış Katsayısı */}
                          <td className="py-3 px-3 border-b border-[#e9ecef] align-middle text-center">
                            <div className="text-sm text-[#111827]">{p.alisSourceCode || '-'}</div>
                            <div className="text-xs text-[#9aa0a6]">
                              {p.alisSourceType === 'alis' ? 'Alış' : 'Satış'} × {p.alisMultiplier} + {p.alisAddition}
                            </div>
                          </td>

                          {/* Müşteri Satış Katsayısı */}
                          <td className="py-3 px-3 border-b border-[#e9ecef] align-middle text-center">
                            <div className="text-sm text-[#111827]">{p.satisSourceCode || '-'}</div>
                            <div className="text-xs text-[#9aa0a6]">
                              {p.satisSourceType === 'alis' ? 'Alış' : 'Satış'} × {p.satisMultiplier} + {p.satisAddition}
                            </div>
                          </td>

                          {/* İşletme Alış inputları */}
                          <td className="py-3 px-3 border-b border-[#e9ecef] align-middle bg-[#F3BA1C]/5">
                            <div className="flex gap-1 justify-center">
                              <input
                                type="number" step="any"
                                value={getBusinessEditValue(p, 'alisMultiplier')}
                                onChange={(e) => handleBusinessEditChange(p.code, 'alisMultiplier', e.target.value)}
                                placeholder="çarpan"
                                className="w-24 px-2 py-1.5 text-sm bg-white border border-[#e9ecef] rounded-lg text-right tabular-nums text-[#111827] focus:border-[#F3BA1C] focus:ring-1 focus:ring-[#F3BA1C] focus:outline-none"
                              />
                              <input
                                type="number" step="any"
                                value={getBusinessEditValue(p, 'alisAddition')}
                                onChange={(e) => handleBusinessEditChange(p.code, 'alisAddition', e.target.value)}
                                placeholder="ekleme"
                                className="w-24 px-2 py-1.5 text-sm bg-white border border-[#e9ecef] rounded-lg text-right tabular-nums text-[#111827] focus:border-[#F3BA1C] focus:ring-1 focus:ring-[#F3BA1C] focus:outline-none"
                              />
                            </div>
                          </td>

                          {/* İşletme Satış inputları */}
                          <td className="py-3 px-3 border-b border-[#e9ecef] align-middle bg-[#F3BA1C]/5">
                            <div className="flex gap-1 justify-center">
                              <input
                                type="number" step="any"
                                value={getBusinessEditValue(p, 'satisMultiplier')}
                                onChange={(e) => handleBusinessEditChange(p.code, 'satisMultiplier', e.target.value)}
                                placeholder="çarpan"
                                className="w-24 px-2 py-1.5 text-sm bg-white border border-[#e9ecef] rounded-lg text-right tabular-nums text-[#111827] focus:border-[#F3BA1C] focus:ring-1 focus:ring-[#F3BA1C] focus:outline-none"
                              />
                              <input
                                type="number" step="any"
                                value={getBusinessEditValue(p, 'satisAddition')}
                                onChange={(e) => handleBusinessEditChange(p.code, 'satisAddition', e.target.value)}
                                placeholder="ekleme"
                                className="w-24 px-2 py-1.5 text-sm bg-white border border-[#e9ecef] rounded-lg text-right tabular-nums text-[#111827] focus:border-[#F3BA1C] focus:ring-1 focus:ring-[#F3BA1C] focus:outline-none"
                              />
                            </div>
                          </td>

                          {/* Fiyatlar: Müşteri (üst) / İşletme (alt) */}
                          <td className="py-3 px-3 border-b border-[#e9ecef] align-middle text-right whitespace-nowrap">
                            <div className="text-xs text-[#9aa0a6] tabular-nums">
                              ₺{fmtNum(p.calculatedAlis, p.decimals ?? 2)} / ₺{fmtNum(p.calculatedSatis, p.decimals ?? 2)}
                            </div>
                            <div className={`text-base font-semibold tabular-nums ${p.hasBusinessOverride ? 'text-[#b88a2b]' : 'text-[#111827]'}`}>
                              ₺{fmtNum(p.businessAlis, p.decimals ?? 2)} / ₺{fmtNum(p.businessSatis, p.decimals ?? 2)}
                            </div>
                          </td>

                          {/* Aksiyonlar */}
                          <td className="py-3 px-3 border-b border-[#e9ecef] align-middle">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => saveBusinessRow(p)}
                                disabled={businessSavingCode === p.code || !isDirty}
                                className="p-2 bg-[#F3BA1C] hover:bg-[#d9a418] disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed text-gray-900 rounded-lg transition-colors"
                                title="Kaydet"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={() => resetBusinessRow(p)}
                                disabled={businessSavingCode === p.code || !p.hasBusinessOverride}
                                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed text-[#111827] rounded-lg transition-colors border border-[#e9ecef]"
                                title="Normale döndür"
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
          )}

          {/* ==================== NOMANOĞLU AİLESİ TAB ==================== */}
          {activeTab === 'family' && (
          <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">NOMANOĞLU Ailesi Kartları</h2>
              <p className="text-gray-600 mt-1">Anasayfada görünecek kurumsal kartları yönetin</p>
            </div>
            <button
              onClick={openCreateFamilyModal}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Kart Ekle</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {familyCards.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-gray-400">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Henüz kart eklenmedi</p>
                  <p className="text-sm mb-4">İlk kartı oluşturarak başlayın</p>
                  <button
                    onClick={openCreateFamilyModal}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Plus size={18} />
                    <span>İlk Kartı Oluştur</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Etiket</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Başlık</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Açıklama</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İkon</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Sıra</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyCards.map((card, index) => (
                      <tr key={card.id} className={`border-b border-gray-100 hover:bg-amber-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">{card.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{card.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{card.description}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-lg">
                            {card.icon === 'TrendingUp' && <TrendingUp size={16} />}
                            {card.icon === 'CheckCircle' && <AlertCircle size={16} />}
                            {card.icon === 'Star' && <Plus size={16} />}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono font-semibold text-gray-700">{card.order}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditFamilyModal(card)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFamily(card.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
          )}

          {/* ==================== REHBER MAKALELERİ TAB ==================== */}
          {activeTab === 'articles' && (
          <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bilgi & Rehber Makaleleri</h2>
              <p className="text-gray-600 mt-1">Anasayfada görünecek içerik makalelerini yönetin</p>
            </div>
            <button
              onClick={openCreateArticleModal}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Makale Ekle</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {articles.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Henüz makale eklenmedi</p>
                  <p className="text-sm mb-4">İlk makaleyi oluşturarak başlayın</p>
                  <button
                    onClick={openCreateArticleModal}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Plus size={18} />
                    <span>İlk Makaleyi Oluştur</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Kategori</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Başlık</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Açıklama</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İkon</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Sıra</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article, index) => (
                      <tr key={article.id} className={`border-b border-gray-100 hover:bg-amber-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{article.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{article.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{article.description}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg">
                            {article.icon === 'Coins' && <TrendingUp size={16} />}
                            {article.icon === 'Gem' && <AlertCircle size={16} />}
                            {article.icon === 'TrendingUp' && <TrendingUp size={16} />}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono font-semibold text-gray-700">{article.order}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditArticleModal(article)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
          )}

          {/* ==================== ŞUBELER TAB ==================== */}
          {activeTab === 'branches' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Şube Yönetimi</h2>
                <p className="text-gray-600 mt-1">Tüm şubelerinizi buradan yönetin</p>
              </div>
              <button
                onClick={openCreateBranchModal}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
              >
                <Plus size={20} />
                <span>Yeni Şube Ekle</span>
              </button>
            </div>

            {branches.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Şube Eklenmedi</h3>
                <p className="text-gray-600 mb-4">İletişim sayfasında görünmesi için şube ekleyin</p>
                <button
                  onClick={openCreateBranchModal}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
                >
                  <Plus size={20} />
                  <span>İlk Şubeyi Ekle</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Şube Adı</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Şehir</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Adres</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">İletişim</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch, index) => (
                      <tr 
                        key={branch.id}
                        className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{branch.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {branch.city}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-xs truncate">{branch.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {branch.phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <Phone size={14} />
                                <span>{branch.phone}</span>
                              </div>
                            )}
                            {branch.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <Mail size={14} />
                                <span>{branch.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditBranchModal(branch)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
          )}

          {/* ==================== İŞLEMLER TAB ==================== */}
          {activeTab === 'transactions' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">İşlemler (KYC Formları)</h2>
                <p className="text-gray-600 mt-1">Mobil uygulamadan gönderilen müşteri tanı formlarını görüntüleyin ve PDF olarak indirin</p>
              </div>
              <button
                onClick={loadTransactions}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                <RefreshCw size={18} />
                <span>Yenile</span>
              </button>
            </div>

            {/* Arama ve Filtreler */}
            {transactions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  {/* Arama */}
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="İsim, T.C. No veya telefon ile ara..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  {/* Şube Filtresi */}
                  <select
                    value={txBranchFilter}
                    onChange={(e) => setTxBranchFilter(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none bg-white min-w-[160px]"
                  >
                    <option value="all">Tüm Şubeler</option>
                    {txBranchOptions.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {/* Durum Filtresi */}
                  <select
                    value={txStatusFilter}
                    onChange={(e) => setTxStatusFilter(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none bg-white min-w-[140px]"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="pending">Beklemede</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                  {/* Tarih Başlangıç */}
                  <input
                    type="date"
                    value={txDateFrom}
                    onChange={(e) => setTxDateFrom(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none bg-white"
                    title="Başlangıç tarihi"
                  />
                  {/* Tarih Bitiş */}
                  <input
                    type="date"
                    value={txDateTo}
                    onChange={(e) => setTxDateTo(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none bg-white"
                    title="Bitiş tarihi"
                  />
                  {/* Filtreleri Temizle */}
                  {(txSearch || txBranchFilter !== 'all' || txStatusFilter !== 'all' || txDateFrom || txDateTo) && (
                    <button
                      onClick={() => { setTxSearch(''); setTxBranchFilter('all'); setTxStatusFilter('all'); setTxDateFrom(''); setTxDateTo(''); }}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                {/* Sonuç Sayısı */}
                {(txSearch || txBranchFilter !== 'all' || txStatusFilter !== 'all' || txDateFrom || txDateTo) && (
                  <div className="mt-3 text-sm text-gray-500">
                    {filteredTransactions.length} / {transactions.length} sonuç gösteriliyor
                  </div>
                )}
              </div>
            )}

            {transactionsLoading ? (
              <div className="text-center py-12">
                <RefreshCw size={32} className="mx-auto text-gray-300 animate-spin mb-4" />
                <p className="text-gray-500">Yükleniyor...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz İşlem Yok</h3>
                <p className="text-gray-600">Mobil uygulamadan form gönderildiğinde burada görünecek</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sonuç Bulunamadı</h3>
                <p className="text-gray-600">Arama kriterlerinize uygun işlem bulunamadı</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Tarih</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Müşteri</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Şube</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-700">Tutar</th>
                      <th className="text-center px-6 py-4 text-sm font-bold text-gray-700">Durum</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(tx.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{tx.fullName}</div>
                          <div className="text-xs text-gray-500">{tx.identityNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {tx.branchId?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {tx.totalAmount?.toLocaleString('tr-TR')} TL
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {tx.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openTxEditModal(tx)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(tx.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="PDF İndir"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleTxDelete(tx.id, tx.fullName)}
                              className="p-2 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* İşlem Düzenleme Modalı */}
            {showTxEditModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">İşlem Düzenle</h3>
                    <button onClick={() => setShowTxEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İsim Soyisim / Ünvan</label>
                        <input type="text" value={txFormData.fullName} onChange={(e) => setTxFormData({...txFormData, fullName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">T.C. No / Vergi No</label>
                        <input type="text" value={txFormData.identityNumber} onChange={(e) => setTxFormData({...txFormData, identityNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                        <input type="text" value={txFormData.phone} onChange={(e) => setTxFormData({...txFormData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meslek</label>
                        <input type="text" value={txFormData.occupation} onChange={(e) => setTxFormData({...txFormData, occupation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input type="date" value={txFormData.date} onChange={(e) => setTxFormData({...txFormData, date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü</label>
                        <div className="flex gap-2">
                          <button type="button"
                            onClick={() => setTxFormData({...txFormData, transactionType: 'alis'})}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${txFormData.transactionType === 'alis' ? 'bg-yellow-400 border-yellow-400 text-gray-900' : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                            Alış
                          </button>
                          <button type="button"
                            onClick={() => setTxFormData({...txFormData, transactionType: 'satis'})}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${txFormData.transactionType === 'satis' ? 'bg-yellow-400 border-yellow-400 text-gray-900' : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                            Satış
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Tutar (TL)</label>
                        <input type="number" value={txFormData.totalAmount} onChange={(e) => setTxFormData({...txFormData, totalAmount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şube</label>
                        <select value={txFormData.branchId} onChange={(e) => setTxFormData({...txFormData, branchId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none bg-white">
                          <option value="">Şube Seçin</option>
                          {branches.map(b => (
                            <option key={b._id} value={b._id}>{b.name} - {b.city}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                        <select value={txFormData.status} onChange={(e) => setTxFormData({...txFormData, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none bg-white">
                          <option value="pending">Beklemede</option>
                          <option value="completed">Tamamlandı</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                      <input type="text" value={txFormData.address} onChange={(e) => setTxFormData({...txFormData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Detay</label>
                      <textarea value={txFormData.details} onChange={(e) => setTxFormData({...txFormData, details: e.target.value})} rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ek Bilgi</label>
                      <textarea value={txFormData.additionalInfo} onChange={(e) => setTxFormData({...txFormData, additionalInfo: e.target.value})} rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-yellow-500 focus:outline-none resize-none" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                    <button onClick={() => setShowTxEditModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                      İptal
                    </button>
                    <button onClick={handleTxUpdate}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
                      <Save size={16} />
                      <span>Kaydet</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
          )}

          {/* ==================== AYARLAR TAB ==================== */}
          {activeTab === 'settings' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ayarlar</h2>
                <p className="text-gray-600 mt-1">Genel site ayarlarını buradan yönetin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logo Ayarları */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings size={20} />
                  <span>Logo Ayarları</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Anasayfa header'ında görünecek logoyu yükleyin (Önerilen: 500KB)
                </p>

                {logoBase64 ? (
                  <div className="space-y-4">
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-center h-32 bg-white rounded-lg">
                        <img
                          src={logoBase64}
                          alt="Logo"
                          className="object-contain"
                          style={{
                            height: `${logoHeight}px`,
                            width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                            maxHeight: '112px',
                            maxWidth: '100%'
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-center border border-blue-200">
                          Değiştir
                        </div>
                      </label>
                      <button
                        onClick={removeLogo}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium border border-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Logo Boyut Ayarları */}
                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Logo Boyutu
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Yükseklik */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">Yükseklik (px)</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="24"
                              max="120"
                              value={logoHeight}
                              onChange={(e) => setLogoHeight(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <input
                              type="number"
                              min="24"
                              max="120"
                              value={logoHeight}
                              onChange={(e) => setLogoHeight(parseInt(e.target.value) || 48)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold text-gray-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Genişlik */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">Genişlik</label>
                          <div className="flex items-center space-x-2">
                            <select
                              value={logoWidth === 'auto' ? 'auto' : 'custom'}
                              onChange={(e) => {
                                if (e.target.value === 'auto') {
                                  setLogoWidth('auto');
                                } else {
                                  setLogoWidth(200);
                                }
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            >
                              <option value="auto">Otomatik</option>
                              <option value="custom">Özel</option>
                            </select>
                            {logoWidth !== 'auto' && (
                              <input
                                type="number"
                                min="50"
                                max="400"
                                value={logoWidth}
                                onChange={(e) => setLogoWidth(parseInt(e.target.value) || 200)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold text-gray-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                        <AlertCircle size={14} />
                        <span>
                          Mevcut: {logoHeight}px × {logoWidth === 'auto' ? 'Otomatik' : `${logoWidth}px`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-amber-500 hover:bg-amber-50 transition-all">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Plus size={32} className="text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700">Logo Yükle</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG (Önerilen: maks 500KB)</p>
                        </div>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* Favicon Ayarları */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings size={20} />
                  <span>Favicon Ayarları</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tarayıcı sekmesinde görünecek ikonu yükleyin (Önerilen: 32x32 veya 64x64 px, maks 100KB)
                </p>

                {faviconBase64 ? (
                  <div className="space-y-4">
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-center h-24 bg-white rounded-lg">
                        <img
                          src={faviconBase64}
                          alt="Favicon"
                          className="object-contain"
                          style={{ width: '64px', height: '64px' }}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.ico"
                          onChange={handleFaviconUpload}
                          className="hidden"
                        />
                        <div className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-center border border-blue-200">
                          Değiştir
                        </div>
                      </label>
                      <button
                        onClick={removeFavicon}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium border border-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,.ico"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-amber-500 hover:bg-amber-50 transition-all">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Plus size={24} className="text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700">Favicon Yükle</p>
                          <p className="text-xs text-gray-500 mt-1">ICO, PNG (Önerilen: 32x32px)</p>
                        </div>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Görüntüleme Ayarları ve Fiyat Tablosu Görseli - Ayrı Satır */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp size={20} />
                  <span>Görüntüleme Ayarları</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maksimum Görüntülenecek Ürün Sayısı
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Anasayfada en fazla kaç fiyat gösterilsin? (TV ekranları için)
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxDisplayItems}
                      onChange={(e) => setMaxDisplayItems(parseInt(e.target.value) || 20)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 text-center text-2xl font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Fiyat Tablosu Görseli */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings size={20} />
                  <span>Fiyat Tablosu Görseli</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Anasayfada fiyat tablosunun yanında görünecek görsel (Önerilen: 5MB, dikey format)
                </p>

                {priceTableImage ? (
                  <div className="space-y-4">
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-center h-48 bg-white rounded-lg overflow-hidden">
                        <img
                          src={priceTableImage}
                          alt="Fiyat Tablosu Görseli"
                          className="object-cover h-full w-full"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePriceTableImageUpload}
                          className="hidden"
                        />
                        <div className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-center border border-blue-200">
                          Değiştir
                        </div>
                      </label>
                      <button
                        onClick={removePriceTableImage}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium border border-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePriceTableImageUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-amber-500 hover:bg-amber-50 transition-all">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Plus size={32} className="text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700">Görsel Yükle</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG (Önerilen: maks 5MB)</p>
                        </div>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Phone size={20} />
                  <span>İletişim Bilgileri</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+90 (XXX) XXX XX XX"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="info@example.com"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                    <input
                      type="text"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="Istanbul, Turkiye"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calisma Saatleri</label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="Pzt - Cmt: 09:00 - 19:00"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calisma Saatleri Notu</label>
                    <input
                      type="text"
                      value={workingHoursNote}
                      onChange={(e) => setWorkingHoursNote(e.target.value)}
                      placeholder="Pazar: Kapali"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Çalışan Şifresi */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users size={20} />
                  <span>Çalışan Şifresi</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Mobil uygulamada çalışanların KYC formuna erişmek için kullanacağı ortak şifre
                </p>
                <div className="mb-3">
                  {hasEmployeePassword ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Şifre ayarlanmış
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Şifre ayarlanmamış
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showEmployeePassword ? 'text' : 'password'}
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    placeholder={hasEmployeePassword ? 'Yeni şifre girin (değiştirmeyecekseniz boş bırakın)' : 'Çalışan şifresi belirleyin...'}
                    className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmployeePassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={showEmployeePassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showEmployeePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={saveSettings}
                    disabled={!employeePassword}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
                  >
                    <Save size={16} />
                    <span>Kaydet</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Bu şifre tüm çalışanlar tarafından paylaşılan tek bir şifredir. Yeni bir şifre girip kaydederseniz tüm çalışanların yeniden giriş yapması gerekir.
                </p>
              </div>

              {/* İşletme Şifresi (şube içi fiyat sayfası) */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Building2 size={20} />
                  <span>İşletme Fiyatları Şifresi</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Şubelerin <code className="bg-gray-100 px-1 rounded">/isletme</code> sayfasından erişeceği özel fiyat yönetimi şifresi. Bu sayfa herkese açık değildir, sadece şube içi kullanım içindir.
                </p>
                <div className="mb-3">
                  {hasBusinessPassword ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Şifre ayarlanmış
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Şifre ayarlanmamış
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showBusinessPassword ? 'text' : 'password'}
                    value={businessPassword}
                    onChange={(e) => setBusinessPassword(e.target.value)}
                    placeholder={hasBusinessPassword ? 'Yeni şifre girin (değiştirmeyecekseniz boş bırakın)' : 'İşletme şifresi belirleyin...'}
                    className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBusinessPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={showBusinessPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showBusinessPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={saveSettings}
                    disabled={!businessPassword}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
                  >
                    <Save size={16} />
                    <span>Kaydet</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Yeni bir şifre girip kaydederseniz oturum açık olan şubelerin tekrar giriş yapması gerekir.
                </p>
              </div>

              {/* Sosyal Medya */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Mail size={20} />
                  <span>Sosyal Medya</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Numarasi</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">+</span>
                      <input
                        type="text"
                        value={socialWhatsapp}
                        onChange={(e) => setSocialWhatsapp(e.target.value)}
                        placeholder="905XXXXXXXXX"
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ulke kodu ile birlikte (ornek: 905322904601)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                    <input
                      type="url"
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter URL</label>
                    <input
                      type="url"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="https://twitter.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                    <input
                      type="url"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Youtube URL</label>
                    <input
                      type="url"
                      value={socialYoutube}
                      onChange={(e) => setSocialYoutube(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok URL</label>
                    <input
                      type="url"
                      value={socialTiktok}
                      onChange={(e) => setSocialTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveSettings}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
              >
                <Save size={20} />
                <span>Ayarları Kaydet</span>
              </button>
            </div>
          </>
          )}

          {/* ==================== KULLANICILAR TAB ==================== */}
          {activeTab === 'users' && auth && auth.isAdmin && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Kullanıcılar</h2>
                <p className="text-gray-500 text-sm mt-1">Personel hesapları oluşturun ve hangi bölümlere erişebileceklerini belirleyin.</p>
              </div>
              <button
                onClick={openCreateUserModal}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
              >
                <Plus size={18} />
                <span>Yeni Kullanıcı</span>
              </button>
            </div>

            {users.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <UserCog size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Henüz kullanıcı yok</h3>
                <p className="text-gray-500 mt-1">Yeni kullanıcı ekleyerek başlayın.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Kullanıcı Adı</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ad</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Yetkiler</th>
                        <th className="text-center px-4 py-4 text-sm font-semibold text-gray-700">Durum</th>
                        <th className="text-center px-4 py-4 text-sm font-semibold text-gray-700">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100">
                          <td className="px-6 py-4 font-semibold text-gray-900">{u.username}</td>
                          <td className="px-6 py-4 text-gray-700">{u.name || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {(u.permissions || []).length === 0 ? (
                                <span className="text-xs text-gray-400">Yetki yok</span>
                              ) : (
                                (u.permissions || []).map((pid) => {
                                  const sec = ADMIN_SECTIONS.find((s) => s.id === pid);
                                  return (
                                    <span key={pid} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                                      {sec ? sec.label : pid}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {u.isActive ? (
                              <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">Aktif</span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1 font-medium">Pasif</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center space-x-2">
                              <button onClick={() => openEditUserModal(u)} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg" title="Düzenle">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg" title="Sil">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
          )}
        </main>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPrice ? 'Fiyat Düzenle' : 'Yeni Fiyat Oluştur'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Genel Bilgiler */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Genel Bilgiler</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat Adı *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="örn: VIP Dolar"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kod *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="örn: VIP_USD"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      >
                        <option value="doviz">Döviz</option>
                        <option value="altin">Altın</option>
                        <option value="gumus">Gümüş</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ondalık Basamak</label>
                      <select
                        value={formData.decimals ?? 0}
                        onChange={(e) => setFormData({...formData, decimals: parseInt(e.target.value)})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      >
                        <option value={0}>0 (Örnek: 35)</option>
                        <option value={1}>1 (Örnek: 35.5)</option>
                        <option value={2}>2 (Örnek: 35.50)</option>
                        <option value={3}>3 (Örnek: 35.500)</option>
                        <option value={4}>4 (Örnek: 35.5000)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* İki Sütunlu Kaynak Yapılandırması */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SOL SÜTUN: Birincil Kaynak */}
                  <div className="space-y-4">
                    <div className="bg-blue-100 rounded-lg p-3 border-2 border-blue-300">
                      <h3 className="font-bold text-blue-800 text-center">🟢 BİRİNCİL KAYNAK (API 1)</h3>
                    </div>

                    {/* Birincil Alış */}
                    <div className="bg-green-50 rounded-xl p-4 space-y-3 border-2 border-green-200">
                      <h4 className="font-semibold text-green-800 flex items-center space-x-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-xs font-bold">A</span>
                        <span>Alış Fiyatı</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak Fiyat</label>
                          <select
                            value={formData.alisConfig.sourceCode}
                            onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, sourceCode: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-green-500 focus:outline-none"
                          >
                            <optgroup label="API Kaynak Fiyatları">
                              {sourcePrices.map(p => (
                                <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                              ))}
                            </optgroup>
                            {customPrices.filter(cp => cp.code !== formData.code).length > 0 && (
                              <optgroup label="Oluşturduğum Fiyatlar">
                                {customPrices.filter(cp => cp.code !== formData.code).map(cp => (
                                  <option key={`custom-${cp.code}`} value={cp.code}>{cp.name} ({cp.code})</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kullanılacak Fiyat</label>
                          <select
                            value={formData.alisConfig.sourceType}
                            onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, sourceType: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-green-500 focus:outline-none"
                          >
                            <option value="alis">Alış</option>
                            <option value="satis">Satış</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Katsayı (×)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={formData.alisConfig.multiplier}
                              onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, multiplier: parseFloat(e.target.value) || 1}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-green-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Ekleme (+)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.alisConfig.addition}
                              onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, addition: parseFloat(e.target.value) || 0}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-green-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-300 text-center">
                        <p className="text-xs text-gray-500 mb-1">Önizleme</p>
                        <p className="text-2xl font-bold text-green-700">₺{formatPrice(calculatePreview(formData.alisConfig), formData.decimals ?? 0)}</p>
                      </div>
                    </div>

                    {/* Birincil Satış */}
                    <div className="bg-red-50 rounded-xl p-4 space-y-3 border-2 border-red-200">
                      <h4 className="font-semibold text-red-800 flex items-center space-x-2">
                        <span className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-xs font-bold">S</span>
                        <span>Satış Fiyatı</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak Fiyat</label>
                          <select
                            value={formData.satisConfig.sourceCode}
                            onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, sourceCode: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-red-500 focus:outline-none"
                          >
                            <optgroup label="API Kaynak Fiyatları">
                              {sourcePrices.map(p => (
                                <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                              ))}
                            </optgroup>
                            {customPrices.filter(cp => cp.code !== formData.code).length > 0 && (
                              <optgroup label="Oluşturduğum Fiyatlar">
                                {customPrices.filter(cp => cp.code !== formData.code).map(cp => (
                                  <option key={`custom-${cp.code}`} value={cp.code}>{cp.name} ({cp.code})</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kullanılacak Fiyat</label>
                          <select
                            value={formData.satisConfig.sourceType}
                            onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, sourceType: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-red-500 focus:outline-none"
                          >
                            <option value="alis">Alış</option>
                            <option value="satis">Satış</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Katsayı (×)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={formData.satisConfig.multiplier}
                              onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, multiplier: parseFloat(e.target.value) || 1}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Ekleme (+)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.satisConfig.addition}
                              onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, addition: parseFloat(e.target.value) || 0}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-red-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-red-300 text-center">
                        <p className="text-xs text-gray-500 mb-1">Önizleme</p>
                        <p className="text-2xl font-bold text-red-700">₺{formatPrice(calculatePreview(formData.satisConfig), formData.decimals ?? 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* SAĞ SÜTUN: Yedek Kaynak */}
                  <div className="space-y-4">
                    <div className="bg-orange-100 rounded-lg p-3 border-2 border-orange-300">
                      <h3 className="font-bold text-orange-800 text-center">🟠 YEDEK KAYNAK (API 2 - Saglamoglu)</h3>
                    </div>

                    {/* Yedek Alış */}
                    <div className="bg-orange-50 rounded-xl p-4 space-y-3 border-2 border-orange-200">
                      <h4 className="font-semibold text-orange-800 flex items-center space-x-2">
                        <span className="w-6 h-6 bg-orange-500 text-white rounded flex items-center justify-center text-xs font-bold">A</span>
                        <span>Yedek Alış Fiyatı</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak Fiyat</label>
                          <select
                            value={formData.backupAlisConfig?.sourceCode || ''}
                            onChange={(e) => setFormData({...formData, backupAlisConfig: {...(formData.backupAlisConfig || {}), sourceCode: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-orange-500 focus:outline-none"
                          >
                            <option value="">-- Kaynak Seçin --</option>
                            <optgroup label="API Kaynak Fiyatları">
                              {backupSourcePrices.map(p => (
                                <option key={p.code} value={p.code}>{p.name || p.code} ({p.code})</option>
                              ))}
                            </optgroup>
                            {customPrices.filter(cp => cp.code !== formData.code).length > 0 && (
                              <optgroup label="Oluşturduğum Fiyatlar">
                                {customPrices.filter(cp => cp.code !== formData.code).map(cp => (
                                  <option key={`custom-${cp.code}`} value={cp.code}>{cp.name} ({cp.code})</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kullanılacak Fiyat</label>
                          <select
                            value={formData.backupAlisConfig?.sourceType || 'satis'}
                            onChange={(e) => setFormData({...formData, backupAlisConfig: {...(formData.backupAlisConfig || {}), sourceType: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-orange-500 focus:outline-none"
                          >
                            <option value="alis">Alış</option>
                            <option value="satis">Satış</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Katsayı (×)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={formData.backupAlisConfig?.multiplier || 1}
                              onChange={(e) => setFormData({...formData, backupAlisConfig: {...(formData.backupAlisConfig || {}), multiplier: parseFloat(e.target.value) || 1}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Ekleme (+)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.backupAlisConfig?.addition || 0}
                              onChange={(e) => setFormData({...formData, backupAlisConfig: {...(formData.backupAlisConfig || {}), addition: parseFloat(e.target.value) || 0}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-orange-300 text-center">
                        <p className="text-xs text-gray-500 mb-1">Önizleme</p>
                        <p className="text-2xl font-bold text-orange-600">₺{formatPrice(calculatePreview(formData.backupAlisConfig, backupSourcePrices), formData.decimals ?? 0)}</p>
                      </div>
                    </div>

                    {/* Yedek Satış */}
                    <div className="bg-amber-50 rounded-xl p-4 space-y-3 border-2 border-amber-200">
                      <h4 className="font-semibold text-amber-800 flex items-center space-x-2">
                        <span className="w-6 h-6 bg-amber-500 text-white rounded flex items-center justify-center text-xs font-bold">S</span>
                        <span>Yedek Satış Fiyatı</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak Fiyat</label>
                          <select
                            value={formData.backupSatisConfig?.sourceCode || ''}
                            onChange={(e) => setFormData({...formData, backupSatisConfig: {...(formData.backupSatisConfig || {}), sourceCode: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-amber-500 focus:outline-none"
                          >
                            <option value="">-- Kaynak Seçin --</option>
                            <optgroup label="API Kaynak Fiyatları">
                              {backupSourcePrices.map(p => (
                                <option key={p.code} value={p.code}>{p.name || p.code} ({p.code})</option>
                              ))}
                            </optgroup>
                            {customPrices.filter(cp => cp.code !== formData.code).length > 0 && (
                              <optgroup label="Oluşturduğum Fiyatlar">
                                {customPrices.filter(cp => cp.code !== formData.code).map(cp => (
                                  <option key={`custom-${cp.code}`} value={cp.code}>{cp.name} ({cp.code})</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kullanılacak Fiyat</label>
                          <select
                            value={formData.backupSatisConfig?.sourceType || 'satis'}
                            onChange={(e) => setFormData({...formData, backupSatisConfig: {...(formData.backupSatisConfig || {}), sourceType: e.target.value}})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-amber-500 focus:outline-none"
                          >
                            <option value="alis">Alış</option>
                            <option value="satis">Satış</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Katsayı (×)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={formData.backupSatisConfig?.multiplier || 1}
                              onChange={(e) => setFormData({...formData, backupSatisConfig: {...(formData.backupSatisConfig || {}), multiplier: parseFloat(e.target.value) || 1}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Ekleme (+)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.backupSatisConfig?.addition || 0}
                              onChange={(e) => setFormData({...formData, backupSatisConfig: {...(formData.backupSatisConfig || {}), addition: parseFloat(e.target.value) || 0}})}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                        <p className="text-xs text-gray-500 mb-1">Önizleme</p>
                        <p className="text-2xl font-bold text-amber-600">₺{formatPrice(calculatePreview(formData.backupSatisConfig, backupSourcePrices), formData.decimals ?? 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.code}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingPrice ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Family Modal */}
        {showFamilyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingFamily ? 'Kartı Düzenle' : 'Yeni Kart Oluştur'}
                </h2>
                <button
                  onClick={() => setShowFamilyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Etiket (Üstteki küçük yazı)</label>
                  <input
                    type="text"
                    value={familyFormData.label}
                    onChange={(e) => setFamilyFormData({...familyFormData, label: e.target.value})}
                    placeholder="örn: 1967'den Beri"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlık *</label>
                  <input
                    type="text"
                    value={familyFormData.title}
                    onChange={(e) => setFamilyFormData({...familyFormData, title: e.target.value})}
                    placeholder="örn: Yarım asırlık deneyim."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                  <textarea
                    value={familyFormData.description}
                    onChange={(e) => setFamilyFormData({...familyFormData, description: e.target.value})}
                    placeholder="Kısa açıklama..."
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">İkon</label>
                    <select
                      value={familyFormData.icon}
                      onChange={(e) => setFamilyFormData({...familyFormData, icon: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    >
                      <option value="TrendingUp">Yükseliş Ok</option>
                      <option value="CheckCircle">Check İşareti</option>
                      <option value="Star">Yıldız</option>
                      <option value="Coins">Para</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sıra</label>
                    <input
                      type="number"
                      value={familyFormData.order}
                      onChange={(e) => setFamilyFormData({...familyFormData, order: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setShowFamilyModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveFamily}
                  disabled={!familyFormData.title}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingFamily ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Article Modal */}
        {showArticleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingArticle ? 'Makaleyi Düzenle' : 'Yeni Makale Oluştur'}
                </h2>
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <input
                    type="text"
                    value={articleFormData.category}
                    onChange={(e) => setArticleFormData({...articleFormData, category: e.target.value})}
                    placeholder="örn: Yatırım, Karşılaştırma, Piyasa"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlık *</label>
                  <input
                    type="text"
                    value={articleFormData.title}
                    onChange={(e) => setArticleFormData({...articleFormData, title: e.target.value})}
                    placeholder="örn: Altın Yatırımı Rehberi"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kısa Açıklama (Özet)</label>
                  <textarea
                    value={articleFormData.description}
                    onChange={(e) => setArticleFormData({...articleFormData, description: e.target.value})}
                    placeholder="Anasayfada görünecek kısa açıklama..."
                    rows={2}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tam İçerik (Makale Detayı)</label>
                  <textarea
                    value={articleFormData.content}
                    onChange={(e) => setArticleFormData({...articleFormData, content: e.target.value})}
                    placeholder="Makalenin tam içeriğini buraya yazın... (Markdown destekler: **kalın**, *italik*, ### Başlık)"
                    rows={10}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Paragraf ayırmak için iki satır boşluk bırakın</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">İkon</label>
                    <select
                      value={articleFormData.icon}
                      onChange={(e) => setArticleFormData({...articleFormData, icon: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    >
                      <option value="Coins">Para</option>
                      <option value="Gem">Mücevher</option>
                      <option value="TrendingUp">Yükseliş</option>
                      <option value="CheckCircle">Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sıra</label>
                    <input
                      type="number"
                      value={articleFormData.order}
                      onChange={(e) => setArticleFormData({...articleFormData, order: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveArticle}
                  disabled={!articleFormData.title}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingArticle ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Branch Modal */}
        {showBranchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBranch ? 'Şubeyi Düzenle' : 'Yeni Şube Ekle'}
                </h2>
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şube Adı *</label>
                    <input
                      type="text"
                      value={branchFormData.name}
                      onChange={(e) => setBranchFormData({...branchFormData, name: e.target.value})}
                      placeholder="örn: Kadirli Şubesi"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şehir *</label>
                    <input
                      type="text"
                      value={branchFormData.city}
                      onChange={(e) => setBranchFormData({...branchFormData, city: e.target.value})}
                      placeholder="örn: Osmaniye"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adres *</label>
                  <textarea
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({...branchFormData, address: e.target.value})}
                    placeholder="Tam adres..."
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={branchFormData.phone}
                      onChange={(e) => setBranchFormData({...branchFormData, phone: e.target.value})}
                      placeholder="örn: 0850 XXX XX XX"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      value={branchFormData.email}
                      onChange={(e) => setBranchFormData({...branchFormData, email: e.target.value})}
                      placeholder="örn: kadirli@nomanoglu.com"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Çalışma Saatleri</label>
                  <input
                    type="text"
                    value={branchFormData.workingHours}
                    onChange={(e) => setBranchFormData({...branchFormData, workingHours: e.target.value})}
                    placeholder="örn: 09:00 - 18:00"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harita Linki (Google Maps)</label>
                  <input
                    type="url"
                    value={branchFormData.mapLink}
                    onChange={(e) => setBranchFormData({...branchFormData, mapLink: e.target.value})}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Google Maps'ten paylaş linkini yapıştırın</p>
                </div>

                {/* Şirket Bilgileri */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Şirket Bilgileri (PDF İçin)</h4>
                  <p className="text-xs text-gray-500 mb-3">Bu bilgiler sadece KYC PDF çıktısında kullanılır, halka açık değildir.</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Ünvanı</label>
                      <input
                        type="text"
                        value={branchFormData.companyTitle}
                        onChange={(e) => setBranchFormData({...branchFormData, companyTitle: e.target.value})}
                        placeholder="örn: Nomanoğlu Kuyumculuk A.Ş."
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vergi Dairesi</label>
                      <input
                        type="text"
                        value={branchFormData.taxOffice}
                        onChange={(e) => setBranchFormData({...branchFormData, taxOffice: e.target.value})}
                        placeholder="örn: Kadirli V.D."
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vergi No</label>
                      <input
                        type="text"
                        value={branchFormData.taxNumber}
                        onChange={(e) => setBranchFormData({...branchFormData, taxNumber: e.target.value})}
                        placeholder="örn: 1234567890"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ticaret Sicil No</label>
                      <input
                        type="text"
                        value={branchFormData.tradeRegistryNo}
                        onChange={(e) => setBranchFormData({...branchFormData, tradeRegistryNo: e.target.value})}
                        placeholder="örn: 12345"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveBranch}
                  disabled={!branchFormData.name || !branchFormData.city || !branchFormData.address}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingBranch ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kullanıcı Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}
                </h2>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı *</label>
                    <input
                      type="text"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                      placeholder="örn. personel1"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad (opsiyonel)</label>
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      placeholder="Ad Soyad"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre {editingUser ? '(değiştirmek için doldurun)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder={editingUser ? 'Boş bırakırsanız değişmez' : 'En az 6 karakter'}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                    <ShieldCheck size={18} className="text-amber-600" />
                    <span>Erişebileceği Bölümler</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ADMIN_SECTIONS.map((sec) => {
                      const checked = userFormData.permissions.includes(sec.id);
                      return (
                        <label
                          key={sec.id}
                          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                            checked ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUserPermission(sec.id)}
                            className="w-4 h-4 accent-amber-600"
                          />
                          <span className="text-sm font-medium text-gray-800">{sec.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userFormData.isActive}
                    onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.checked })}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Hesap aktif (kapatırsanız giriş yapamaz)</span>
                </label>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 sticky bottom-0">
                <button onClick={() => setShowUserModal(false)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium">
                  İptal
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={userSaving || !userFormData.username.trim() || (!editingUser && !userFormData.password)}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{userSaving ? 'Kaydediliyor...' : (editingUser ? 'Güncelle' : 'Oluştur')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
