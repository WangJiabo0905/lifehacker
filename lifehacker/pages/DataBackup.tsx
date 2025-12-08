import React from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle, Database } from 'lucide-react';

export const DataBackupPage: React.FC = () => {
  
  const handleExport = () => {
    // Collect ALL data keys
    const data = {
      records: localStorage.getItem('essence_records'),       // 工作 & 开销
      not_to_do: localStorage.getItem('essence_not_to_do'),   // 不为清单
      success: localStorage.getItem('essence_success'),       // 成功日记
      ideas: localStorage.getItem('essence_ideas'),           // 赚钱想法
      inspiration: localStorage.getItem('essence_inspiration'), // 启发清单 (新增)
      dreams: localStorage.getItem('essence_dreams'),         // 梦想相册 (含图片Base64)
      finance: localStorage.getItem('essence_finance_v2'),    // 理财配置
      plans: localStorage.getItem('essence_plans'),           // 每日计划 & 复盘
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Essence_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ 严重警告：\n\n导入数据将【完全覆盖】您当前浏览器中的所有记录！\n\n包括您的梦想相册、所有清单、财务设置和时间记录。\n\n确定要继续吗？")) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Simple validation
        if (!json.exportDate) throw new Error("无效的备份文件：缺少时间戳");

        // Restore ALL keys
        if(json.records) localStorage.setItem('essence_records', json.records);
        if(json.not_to_do) localStorage.setItem('essence_not_to_do', json.not_to_do);
        if(json.success) localStorage.setItem('essence_success', json.success);
        if(json.ideas) localStorage.setItem('essence_ideas', json.ideas);
        if(json.inspiration) localStorage.setItem('essence_inspiration', json.inspiration);
        if(json.dreams) localStorage.setItem('essence_dreams', json.dreams);
        if(json.finance) localStorage.setItem('essence_finance_v2', json.finance);
        if(json.plans) localStorage.setItem('essence_plans', json.plans);

        alert(`数据恢复成功！\n备份日期: ${new Date(json.exportDate).toLocaleString()}\n页面将刷新以加载新数据。`);
        window.location.reload();

      } catch (err) {
        alert("导入失败：文件格式错误或已损坏。");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <header>
        <h2 className="text-3xl font-bold text-white">数据资产</h2>
        <p className="text-white/70 mt-1">您完全拥有您的数据。备份包含所有清单、图片和记录。</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Export Card */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-white/20 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Database size={100} className="text-[#8E5E73]" />
           </div>
           
           <div className="flex items-start gap-4 mb-6 relative z-10">
             <div className="bg-[#8E5E73]/10 p-3 rounded-xl text-[#8E5E73]">
                <Download size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900">全量备份 (导出)</h3>
                <p className="text-gray-500 text-sm mt-1">
                    生成一个包含您所有数据的 JSON 文件。
                </p>
                <ul className="text-xs text-gray-400 mt-2 list-disc list-inside space-y-1">
                    <li>工作时长与开销记录</li>
                    <li>所有清单（含启发记录的文章内容）</li>
                    <li>每日计划与复盘</li>
                    <li>梦想相册（包含所有图片数据）</li>
                    <li>财务配置</li>
                </ul>
             </div>
           </div>
           <button 
             onClick={handleExport}
             className="w-full bg-[#8E5E73] text-white py-4 rounded-xl font-medium hover:bg-[#7a4f61] transition-transform active:scale-95 flex items-center justify-center gap-2 relative z-10"
           >
              <Download size={18} />
              <span>下载全量备份文件</span>
           </button>
        </div>

        {/* Import Card */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-white/20">
           <div className="flex items-start gap-4 mb-6">
             <div className="bg-gray-100 p-3 rounded-xl text-gray-700">
                <Upload size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900">数据恢复 (导入)</h3>
                <p className="text-gray-500 text-sm mt-1">上传之前的备份文件以完全还原您的数字生活。</p>
             </div>
           </div>
           
           <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6 flex gap-3">
              <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
              <div className="space-y-1">
                  <p className="text-orange-800 text-sm font-bold">
                      操作不可逆警告
                  </p>
                  <p className="text-orange-700 text-xs leading-relaxed">
                      导入将<strong>清除并覆盖</strong>当前设备上的所有现有数据。建议在导入前先导出当前数据作为备份。
                  </p>
              </div>
           </div>

           <label className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400">
              <Upload size={18} />
              <span>选择备份文件 (.json)</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
           </label>
        </div>

        <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <ShieldCheck size={14} />
            <span>数据仅存储于本地 LocalStorage，无云端同步，绝对私密。</span>
        </div>

      </div>
    </div>
  );
};