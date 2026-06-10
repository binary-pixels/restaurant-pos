"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Smartphone, Printer, QrCode, Monitor, Wifi, Key, ExternalLink } from "lucide-react";

const sections = [
  {
    title: "硬件设备", icon: Printer, color: "bg-blue-500",
    items: [
      { label: "云打印机", desc: "芯烨云/USB 热敏打印", status: "已连接 2 台" },
      { label: "桌贴二维码", desc: "扫码点餐桌贴", status: "18 张已生成" },
      { label: "后厨大屏", desc: "KDS 厨房显示系统", status: "未配置" },
    ],
  },
  {
    title: "小程序前端", icon: Smartphone, color: "bg-green-500",
    items: [
      { label: "顾客端小程序", desc: "点餐/储值/外卖", status: "v1.0.0 已发布" },
      { label: "小程序助手", desc: "员工手机端管理", status: "已绑定 3 人" },
    ],
  },
  {
    title: "开发配置", icon: Key, color: "bg-purple-500",
    items: [
      { label: "API Keys", desc: "第三方接口密钥", status: "2 个密钥" },
      { label: "Webhooks", desc: "事件推送地址", status: "未配置" },
      { label: "微信支付品牌", desc: "品牌入驻申请", status: "审核中" },
    ],
  },
];

export default function EcosystemPage() {
  return (
    <div>
      <PageHeader title="配套生态" description="硬件设备、小程序和开发配置" />

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border">
            <div className="px-6 py-4 border-b flex items-center gap-3">
              <div className={`${section.color} p-2 rounded-lg`}>
                <section.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
            </div>
            <div className="divide-y">
              {section.items.map((item) => (
                <div key={item.label} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{item.status}</span>
                    <button className="text-blue-600 hover:text-blue-700">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Preview */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5" /> 桌码样式预览
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["A01", "A02", "V01", "外卖"].map((label) => (
            <div key={label} className="border rounded-xl p-4 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">扫码点餐</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
