'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPackage, FiCheck, FiShoppingBag, FiInfo, FiAlertCircle } from 'react-icons/fi';

export default function StudentProducts({ student }) {
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [ordering, setOrdering] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // جلب المنتجات المفعلة فقط
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        setProducts(prods || []);

        // جلب طلبات الطالب الحالية
        const { data: ords } = await supabase
          .from('product_orders')
          .select('*')
          .eq('student_id', student.id);
          
        setMyOrders(ords || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [student.id]);

  const handleOrder = async (product) => {
    // التأكد إن الكمية تسمح
    if (product.available_count <= 0) {
      return toast.error('للأسف الكمية نفذت 😔');
    }

    setOrdering(product.id);
    
    const { error } = await supabase.from('product_orders').insert({
      product_id: product.id,
      student_id: student.id,
      student_name: student.name,
      student_phone: student.phone,
      notes: notes[product.id] || '',
      status: 'pending',
      price_at_order: product.price // تسجيل السعر وقت الطلب مهم جداً
    });

    if (error) {
      toast.error('حدث خطأ أثناء الطلب');
    } else {
      toast.success(`تم طلب ${product.title} بنجاح! ✅`);
      // تحديث القائمة محلياً بدل ما نلود من السيرفر تاني
      setMyOrders(prev => [...prev, { product_id: product.id, status: 'pending' }]);
    }
    setOrdering(null);
  };

  const getOrder = (productId) => myOrders.find(o => o.product_id === productId);
  
  const statusConfig = {
    pending: { label: 'قيد المراجعة', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: '⏳' },
    confirmed: { label: 'تم التأكيد', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: '✅' },
    delivered: { label: 'تم التسليم', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: '📦' },
    cancelled: { label: 'ملغي', color: 'text-rose-400', bg: 'bg-rose-400/10', icon: '❌' },
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">جاري تحميل المتجر...</div>;

  if (products.length === 0) return (
    <div className="glass rounded-[2rem] p-16 text-center border-dashed border-2 border-white/5">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiPackage className="text-4xl text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-300">المتجر فارغ حالياً</h3>
      <p className="text-gray-500 mt-2 text-sm">تابع القناة لمعرفة موعد نزول المذكرات الجديدة 📢</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {products.map(product => {
        const order = getOrder(product.id);
        const config = order ? statusConfig[order.status] : null;
        const isOutOfStock = product.available_count <= 0;

        return (
          <div key={product.id} className="glass rounded-3xl p-6 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
            {/* الخلفية الملونة الخفيفة */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-colors ${isOutOfStock ? 'bg-gray-500' : 'bg-primary'}`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-primary/20">
                  {product.type === 'book' ? '📗' : product.type === 'summary' ? '📋' : '📦'}
                </div>
                <div className="text-left">
                  <span className="block text-2xl font-black text-white">{product.price} <small className="text-xs text-gray-400">ج.م</small></span>
                  {product.available_count < 10 && !isOutOfStock && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full animate-pulse">
                      باقي {product.available_count} فقط!
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{product.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-6 flex-1 line-clamp-2">
                {product.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}
              </p>

              <div className="pt-4 border-t border-white/5">
                {!order ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <FiInfo className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input 
                        type="text" 
                        placeholder="أضف ملاحظة لطلبك..." 
                        value={notes[product.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [product.id]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-9 pl-3 text-xs text-white focus:border-primary/50 transition-all outline-none" 
                      />
                    </div>
                    
                    <button 
                      onClick={() => handleOrder(product)} 
                      disabled={ordering === product.id || isOutOfStock}
                      className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isOutOfStock 
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                        : 'gradient-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/40'
                      }`}
                    >
                      {ordering === product.id ? (
                        'جاري الطلب...'
                      ) : isOutOfStock ? (
                        <><FiAlertCircle /> نفذت الكمية</>
                      ) : (
                        <><FiShoppingBag size={18} /> اطلب النسخة الآن</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className={`w-full py-3 rounded-xl flex items-center justify-center gap-3 border ${config.bg} ${config.color} border-current/20`}>
                    <span className="text-lg">{config.icon}</span>
                    <div className="text-right">
                      <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">حالة الطلب</p>
                      <p className="text-sm font-black">{config.label}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
