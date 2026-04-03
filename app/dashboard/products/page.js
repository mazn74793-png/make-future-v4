'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiPackage, FiCheck, FiX, FiClock } from 'react-icons/fi';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: 0, type: 'book', available_count: '' });

  const load = async () => {
    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(prods || []);
    const { data: ords } = await supabase
      .from('product_orders')
      .select('*, products(title, price), students(name, phone)')
      .order('created_at', { ascending: false });
    setOrders(ords || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title) { toast.error('اكتب عنوان المنتج'); return; }
    const { error } = await supabase.from('products').insert({
      ...form,
      available_count: form.available_count ? parseInt(form.available_count) : null,
    });
    if (error) toast.error(error.message);
    else { toast.success('✅ تم إضافة المنتج'); setShowForm(false); setForm({ title: '', description: '', price: 0, type: 'book', available_count: '' }); load(); }
  };

  const toggleProduct = async (id, current) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    load();
  };

  const deleteProduct = async (id) => {
    if (!confirm('متأكد؟')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('اتمسح'); load();
  };

  const updateOrder = async (id, status) => {
    await supabase.from('product_orders').update({ status }).eq('id', id);
    toast.success(status === 'confirmed' ? '✅ تم التأكيد' : status === 'delivered' ? '📦 تم التسليم' : '❌ تم الإلغاء');
    load();
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status !== 'pending');

  const typeLabel = { book: '📗 كتاب', summary: '📋 ملزمة', other: '📦 أخرى' };
  const statusColor = { pending: 'text-yellow-400 bg-yellow-400/10', confirmed: 'text-blue-400 bg-blue-400/10', delivered: 'text-green-400 bg-green-400/10', cancelled: 'text-red-400 bg-red-400/10' };
  const statusLabel = { pending: '⏳ معلق', confirmed: '✅ مؤكد', delivered: '📦 مسلّم', cancelled: '❌ ملغي' };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">المنتجات والطلبات</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
          <FiPlus /> {showForm ? 'إلغاء' : 'منتج جديد'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 mb-1 block">العنوان *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="كتاب الرياضيات..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 mb-1 block">التفاصيل</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="وصف المنتج..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">النوع</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none">
                <option value="book">📗 كتاب</option>
                <option value="summary">📋 ملزمة</option>
                <option value="other">📦 أخرى</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">السعر (جنيه)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">الكمية المتاحة (اختياري)</label>
              <input type="number" value={form.available_count} onChange={e => setForm({ ...form, available_count: e.target.value })}
                placeholder="اتركها فاضية لو مفيش حد"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
          <button onClick={handleCreate} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">
            إضافة المنتج
          </button>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <button onClick={() => setActiveTab('products')}
          className={`px-5 py-2 rounded-xl font-bold transition ${activeTab === 'products' ? 'gradient-primary text-white' : 'bg-white/5 text-gray-400'}`}>
          📦 المنتجات ({products.length})
        </button>
        <button onClick={() => setActiveTab('orders')}
          className={`px-5 py-2 rounded-xl font-bold transition ${activeTab === 'orders' ? 'gradient-primary text-white' : 'bg-white/5 text-gray-400'}`}>
          📋 الطلبات {pendingOrders.length > 0 && <span className="bg-yellow-400/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full mr-1">{pendingOrders.length}</span>}
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">
                {p.type === 'book' ? '📗' : p.type === 'summary' ? '📋' : '📦'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{p.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-400 mt-0.5">
                  <span>{typeLabel[p.type]}</span>
                  <span>💰 {p.price} جنيه</span>
                  {p.available_count && <span>📊 {p.available_count} متاح</span>}
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${p.is_active ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'}`}>
                {p.is_active ? 'متاح' : 'مخفي'}
              </span>
              <button onClick={() => toggleProduct(p.id, p.is_active)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm">
                {p.is_active ? '🙈' : '👁️'}
              </button>
              <button onClick={() => deleteProduct(p.id)}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
                <FiTrash2 />
              </button>
            </div>
          ))}
          {products.length === 0 && <div className="glass rounded-2xl p-10 text-center text-gray-400">مفيش منتجات لسه</div>}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {pendingOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                <FiClock /> طلبات جديدة ({pendingOrders.length})
              </h2>
              <div className="space-y-3">
                {pendingOrders.map(o => (
                  <div key={o.id} className="glass rounded-xl p-4 border border-yellow-400/20">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-bold">{o.students?.name}</p>
                        <p className="text-gray-400 text-sm">{o.students?.phone}</p>
                        <p className="text-purple-400 text-sm mt-1">📦 {o.products?.title} — {o.products?.price} جنيه</p>
                        {o.notes && <p className="text-gray-500 text-xs mt-1">ملاحظة: {o.notes}</p>}
                        <p className="text-gray-600 text-xs mt-1">{new Date(o.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateOrder(o.id, 'confirmed')}
                          className="bg-green-500/20 text-green-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-green-500/30 flex items-center gap-1">
                          <FiCheck /> تأكيد
                        </button>
                        <button onClick={() => updateOrder(o.id, 'cancelled')}
                          className="bg-red-500/20 text-red-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-500/30 flex items-center gap-1">
                          <FiX /> إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {confirmedOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-400 mb-3">الطلبات السابقة</h2>
              <div className="space-y-2">
                {confirmedOrders.map(o => (
                  <div key={o.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold">{o.students?.name}</p>
                      <p className="text-gray-400 text-sm">{o.products?.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusColor[o.status]}`}>
                        {statusLabel[o.status]}
                      </span>
                      {o.status === 'confirmed' && (
                        <button onClick={() => updateOrder(o.id, 'delivered')}
                          className="bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-500/30">
                          📦 سلّمت
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orders.length === 0 && <div className="glass rounded-2xl p-10 text-center text-gray-400">مفيش طلبات لسه</div>}
        </div>
      )}
    </div>
  );
        }
