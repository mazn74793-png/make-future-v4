'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiPackage, FiCheck, FiX, FiClock, FiShoppingBag, FiInfo } from 'react-icons/fi';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', price: 0, type: 'book', available_count: '' });

  const load = async () => {
    setLoading(true);
    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(prods || []);
    
    const { data: ords } = await supabase
      .from('product_orders')
      .select('*, products(title, price), students(name, phone)')
      .order('created_at', { ascending: false });
    setOrders(ords || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title) return toast.error('من فضلك اكتب عنوان المنتج');
    if (form.price < 0) return toast.error('السعر لا يمكن أن يكون سالباً');

    const { error } = await supabase.from('products').insert({
      ...form,
      available_count: form.available_count ? parseInt(form.available_count) : null,
      is_active: true
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تمت إضافة المنتج بنجاح 🚀');
      setShowForm(false);
      setForm({ title: '', description: '', price: 0, type: 'book', available_count: '' });
      load();
    }
  };

  const toggleProduct = async (id, current) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (!error) {
      toast.success(current ? 'تم إخفاء المنتج' : 'المنتج متاح الآن');
      load();
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      toast.success('تم الحذف');
      load();
    }
  };

  const updateOrder = async (id, status) => {
    const { error } = await supabase.from('product_orders').update({ status }).eq('id', id);
    if (!error) {
      const msgs = { confirmed: 'تم تأكيد الطلب ✅', delivered: 'تم التسليم بنجاح 📦', cancelled: 'تم إلغاء الطلب ❌' };
      toast.success(msgs[status]);
      load();
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const otherOrders = orders.filter(o => o.status !== 'pending');

  const typeLabel = { book: '📗 كتاب', summary: '📋 ملزمة', other: '📦 أخرى' };
  const statusStyles = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  };

  return (
    <div className="animate-fade-in" dir="rtl">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">المتجر والطلبات</h1>
          <p className="text-gray-400 text-sm mt-1">إدارة الكتب، الملازم، وطلبات الشراء</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${showForm ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'gradient-primary text-white shadow-lg shadow-purple-500/20'}`}
        >
          {showForm ? <><FiX /> إلغاء</> : <><FiPlus /> منتج جديد</>}
        </button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <div className="glass rounded-3xl p-6 mb-8 border border-white/10 shadow-2xl animate-slide-down">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FiPlus className="text-purple-400"/> إضافة منتج جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mr-2 mb-1 block uppercase tracking-wider">عنوان المنتج</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: كتاب الفيزياء للثانوية العامة"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-purple-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mr-2 mb-1 block uppercase tracking-wider">الوصف</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="اكتب تفاصيل المنتج هنا..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-purple-500 focus:outline-none resize-none transition-all" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mr-2 mb-1 block uppercase tracking-wider">نوع المنتج</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#111116] border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-purple-500 focus:outline-none transition-all">
                  <option value="book">📗 كتاب مطبوع</option>
                  <option value="summary">📋 ملزمة ورق</option>
                  <option value="other">📦 أخرى</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mr-2 mb-1 block uppercase tracking-wider">السعر</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mr-2 mb-1 block uppercase tracking-wider">الكمية</label>
                  <input type="number" value={form.available_count} onChange={e => setForm({ ...form, available_count: e.target.value })}
                    placeholder="∞"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-purple-500 focus:outline-none text-center" />
                </div>
              </div>
              <button onClick={handleCreate} className="w-full gradient-primary py-4 rounded-2xl text-white font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all mt-2">
                تأكيد الإضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex p-1.5 bg-white/5 rounded-2xl w-fit mb-8 border border-white/5">
        <button onClick={() => setActiveTab('products')}
          className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
          المخزن ({products.length})
        </button>
        <button onClick={() => setActiveTab('orders')}
          className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
          الطلبات 
          {pendingOrders.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-md animate-bounce">{pendingOrders.length}</span>}
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="glass rounded-[2rem] p-5 border border-white/5 hover:border-purple-500/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 duration-500 ${p.is_active ? 'bg-purple-500/10' : 'bg-gray-500/10 grayscale'}`}>
                  {p.type === 'book' ? '📗' : p.type === 'summary' ? '📋' : '📦'}
                </div>
                <div className="flex gap-1">
                   <button onClick={() => toggleProduct(p.id, p.is_active)}
                    className={`p-2.5 rounded-xl border transition-all ${p.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
                    title={p.is_active ? "إخفاء عن الطلبة" : "إظهار للطلبة"}>
                    {p.is_active ? '👁️' : '🙈'}
                  </button>
                  <button onClick={() => deleteProduct(p.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <h3 className="font-black text-lg mb-1">{p.title}</h3>
              <p className="text-gray-500 text-xs line-clamp-2 mb-4 h-8">{p.description || 'لا يوجد وصف للمنتج'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">السعر</span>
                   <span className="text-xl font-black text-purple-400">{p.price} <small className="text-[10px]">جنيه</small></span>
                </div>
                {p.available_count && (
                  <div className="text-left">
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">المخزون</span>
                     <span className="text-sm font-bold text-gray-300">{p.available_count} وحدة</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && (
             <div className="col-span-full glass rounded-[2.5rem] py-20 text-center border-dashed border-2 border-white/5">
                <FiPackage className="text-6xl text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">المخزن فاضي.. ابدأ بزيادة منتجاتك</p>
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* New Orders Section */}
          {pendingOrders.length > 0 && (
            <div className="animate-slide-up">
              <h2 className="text-amber-500 font-black mb-4 flex items-center gap-2 mr-2">
                <FiClock className="animate-pulse"/> طلبات تنتظر التأكيد
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOrders.map(o => (
                  <div key={o.id} className="glass rounded-3xl p-6 border-r-4 border-r-amber-500 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-3 opacity-5"><FiShoppingBag size={80}/></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h4 className="font-black text-lg">{o.students?.name}</h4>
                        <p className="text-gray-400 text-sm font-medium">{o.students?.phone}</p>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-gray-500 block mb-1">تاريخ الطلب</span>
                        <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded-lg tracking-tighter">
                           {new Date(o.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl p-4 mb-6 relative z-10">
                       <p className="text-xs font-bold text-gray-500 mb-1">المنتج المطلوب:</p>
                       <div className="flex justify-between items-center">
                          <span className="font-bold text-purple-400">{o.products?.title}</span>
                          <span className="font-black text-white">{o.products?.price} ج.م</span>
                       </div>
                       {o.notes && <p className="mt-2 text-xs text-amber-500/70 italic border-t border-white/5 pt-2">📝 {o.notes}</p>}
                    </div>

                    <div className="flex gap-2 relative z-10">
                      <button onClick={() => updateOrder(o.id, 'confirmed')}
                        className="flex-1 bg-emerald-500/20 text-emerald-500 py-3 rounded-xl text-sm font-black hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                        <FiCheck /> تأكيد الطلب
                      </button>
                      <button onClick={() => updateOrder(o.id, 'cancelled')}
                        className="px-4 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Orders History */}
          <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
             <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-black text-gray-400 flex items-center gap-2"><FiInfo/> سجل الطلبات السابقة</h3>
             </div>
             <div className="overflow-x-auto text-right">
                <table className="w-full">
                   <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-white/[0.01]">
                      <tr>
                        <th className="px-6 py-4">الطالب / الموبايل</th>
                        <th className="px-6 py-4">المنتج</th>
                        <th className="px-6 py-4 text-center">الحالة</th>
                        <th className="px-6 py-4">إجراءات</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {otherOrders.map(o => (
                        <tr key={o.id} className="hover:bg-white/[0.01] transition-colors">
                           <td className="px-6 py-4 italic font-medium">{o.students?.name} <br/> <span className="text-xs text-gray-600 not-italic">{o.students?.phone}</span></td>
                           <td className="px-6 py-4 font-bold text-gray-300">{o.products?.title}</td>
                           <td className="px-6 py-4 text-center">
                              <span className={`text-[10px] px-3 py-1 rounded-full font-black border uppercase tracking-tighter ${statusStyles[o.status]}`}>
                                 {o.status === 'confirmed' ? 'مؤكد' : o.status === 'delivered' ? 'مسلّم' : 'ملغي'}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              {o.status === 'confirmed' && (
                                <button onClick={() => updateOrder(o.id, 'delivered')}
                                  className="text-xs bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-lg font-bold border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all">
                                  تغيير لـ مسلّم 📦
                                </button>
                              )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                {otherOrders.length === 0 && (
                   <div className="py-10 text-center text-gray-600 italic">لا توجد طلبات سابقة حتى الآن</div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
