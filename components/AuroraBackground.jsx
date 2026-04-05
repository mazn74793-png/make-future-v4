export default function AuroraBackground() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#030303]"
    >
      {/* الـ Orbs الملونة */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />
      <div className="aurora-orb aurora-orb-4" />

      {/* طبقة نويز (Grain) اختيارية بتدي ملمس شيك جداً */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* تعتيم خفيف للتأكد من مقروئية النصوص */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
    </div>
  );
}
