'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPackage, FiCheck } from 'react-icons/fi';

export default function StudentProducts({ student }) {
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [ordering, setOrdering] = useState(null);
  const [notes, setNotes] = useState({});

  useEffect(() => {
    const load = async () => {
      const { data: prods } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
      setProducts(prods || []);
      const { data: ords } = await supabase.from('product_orders').select('*, products(title)').eq('student_id', student.id);
      setMyOrders(ords || []);
    };
    load();
  }, [student.id]);

  const handleOrder = async (productId) => {
    setOrdering(productId);
    const { error } = await supabase.from('product_orders').insert({
      product_id: productId,
      student_id: student.id,
      student_name: student.name,
      student_phone: student.phone,
      notes: notes[productId] || '',
      status: 'pending',
    });
    if (error) toast.error(error.message);
    else {
      toast.success('✅ تم إرسال طلبك!');
      setMyOrders(prev => [...prev, { product_id: productId, status: 'pending' }]);
    }
    setOrdering(null);
  };

  const getOrder = (productId) => myOrders.find(o => o.product_id === productId);
  const statusLabel = { pending: '⏳ قيد المراجعة', confirmed: '✅ تم التأكيد', delivered: '📦 تم التسليم', cancelled: '❌ ملغي' };

  if (products.length === 0) return (
    <div className="glass rounded-2xl p-16 text-center">
      <FiPackage className="text-6xl text-gray-500 mx-auto mb-4" />
      <p className="text-gray-400 text-xl">مفيش منتجات متاحة دلوقتي</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {products.map(product => {
        const order = getOrder(product.id);
        return (
          <div key={product.id} className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                {product.type === 'book' ? '📗' : product.type === 'summary' ? '📋' : '📦'}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg">{product.title}</h3>
                {product.description && <p className="text-gray-400 text-sm mt-1">{product.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-purple-400 font-bold text-lg">{product.price} جنيه</span>
                  {product.available_count && (
                    <span className="text-gray-400 text-xs bg-white/5 px-2 py-1 rounded-lg">
                      متاح: {product.available_count}
                    </span>
                  )}
                </div>

                {!order ? (
                  <div className="mt-3 space-y-2">
                    <input type="text" placeholder="ملاحظة (اختياري)" value={notes[product.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [product.id]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:border-purple-500 focus:outline-none" />
                    <button onClick={() => handleOrder(product.id)} disabled={ordering === product.id}
                      className="gradient-primary px-6 py-2 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                      {ordering === product.id ? '⏳ جاري...' : <><FiCheck /> اطلب الآن</>}
                    </button>
                  </div>
                ) : (
                  <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                    order.status === 'delivered' ? 'bg-green-400/10 text-green-400' :
                    order.status === 'confirmed' ? 'bg-blue-400/10 text-blue-400' :
                    order.status === 'cancelled' ? 'bg-red-400/10 text-red-400' :
                    'bg-yellow-400/10 text-yellow-400'
                  }`}>
                    {statusLabel[order.status] || '⏳ قيد المراجعة'}
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
